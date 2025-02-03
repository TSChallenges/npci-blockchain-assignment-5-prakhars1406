const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const FabricCAServices = require('fabric-ca-client');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');

const mspOrg1 = 'Org1MSP';
const org1UserId = 'appUser';

async function main() {
    try {
        const ccpPath = path.resolve(__dirname, '..', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

        await enrollAdmin(caClient, wallet, mspOrg1);

		// in a real application this would be done only when a new user was required to be added
		// and would be part of an administrative flow
		await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');

        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'appUser',
            discovery: { enabled: true, asLocalhost: true }
        });

        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('asset-management');

        await contract.submitTransaction('CreateAsset', 'asset101', 'Prakhar-Sharma', 111);
        console.log('Transaction has been submitted');

        var result = await contract.evaluateTransaction('ReadAsset', 'asset101');
        console.log(`Asset details: ${result.toString()}`);

        await contract.submitTransaction('UpdateAsset', 'asset101', 'Prakhar-Sharma-New', 222);
        console.log('Asset has been updated successfully');

        result = await contract.evaluateTransaction('ReadAsset', 'asset101');
        console.log(`Updated asset details: ${result.toString()}`);

        await contract.submitTransaction('DeleteAsset', 'asset101');
        console.log('Asset has been deleted successfully');

        try {
            result = await contract.evaluateTransaction('ReadAsset', 'asset101');
        } catch (error) {
            console.error(`Failed to Read asset: ${error}`);
            gateway.disconnect();
        }

        gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
    }
}

main();