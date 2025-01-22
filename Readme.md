# Blockchain Assignment: Asset Management Using Hyperledger Fabric on GitHub Codespaces

## Objective

The goal of this assignment is to create a blockchain application using Hyperledger Fabric on GitHub Codespaces. 

### By completing this assignment, you will:
- Set up a Hyperledger Fabric environment.
- Write and deploy smart contracts (chaincode).
- Interact with the blockchain network using client applications.

---

## Prerequisites

1. **GitHub Account**
2. **Access to GitHub Codespaces**
3. **Basic Knowledge of Docker and Blockchain Concepts**

---

## Problem Statement

### Create an Asset Management System on Hyperledger Fabric

You are tasked with creating a simple asset management system using Hyperledger Fabric. The system should allow users to perform the following operations:

1. **Add an Asset**: Add a new asset with a unique ID, owner name, and value.
2. **Read an Asset**: Retrieve the details of an asset using its ID.
3. **Update an Asset**: Update the owner or value of an existing asset.
4. **Delete an Asset**: Remove an asset from the ledger using its ID.

---

## Overview

### Part 1: Setting Up Hyperledger Fabric Environment



1. **Configure GitHub Codespaces**
   - Open your repository in GitHub Codespaces.
   - Install the required tools and dependencies:
     - Docker and Docker Compose
     - Node.js and npm
     - Go programming language

   Add a `.devcontainer/devcontainer.json` file to configure the Codespace:
   ```json
   {
     "name": "Hyperledger Fabric",
     "image": "mcr.microsoft.com/devcontainers/base:ubuntu",
     "features": {
       "docker-in-docker": "latest",
       "node": "lts",
       "go": "latest"
     },
     "postCreateCommand": "npm install -g @hyperledger/caliper-cli"
   }
   ```

2. **Set Up Hyperledger Fabric Samples**
   - Clone the Hyperledger Fabric Samples repository inside your Codespace:
     ```bash
     git clone https://github.com/hyperledger/fabric-samples.git
     ```
   - Navigate to the `test-network` directory and set up the network:
     ```bash
     cd fabric-samples/test-network
     ./network.sh up createChannel -c mychannel -ca
     ```

---

### Part 2: Develop the Smart Contract

1. **Write the Chaincode**
   - Create a new chaincode application in the `chaincode` directory:
     ```bash
     mkdir -p chaincode/asset-management/go
     cd chaincode/asset-management/go
     ```
   - Write a `chaincode.go` file with the following example code:
     ```go
     package main

     import (
         "encoding/json"
         "fmt"
         "github.com/hyperledger/fabric-contract-api-go/contractapi"
     )

     type SmartContract struct {
         contractapi.Contract
     }

     type Asset struct {
         ID    string `json:"id"`
         Owner string `json:"owner"`
         Value int    `json:"value"`
     }

     func (s *SmartContract) CreateAsset(ctx contractapi.TransactionContextInterface, id string, owner string, value int) error {
         asset := Asset{
             ID:    id,
             Owner: owner,
             Value: value,
         }

         assetJSON, err := json.Marshal(asset)
         if err != nil {
             return err
         }

         return ctx.GetStub().PutState(id, assetJSON)
     }

     func (s *SmartContract) ReadAsset(ctx contractapi.TransactionContextInterface, id string) (*Asset, error) {
         assetJSON, err := ctx.GetStub().GetState(id)
         if err != nil {
             return nil, fmt.Errorf("failed to read asset: %v", err)
         }
         if assetJSON == nil {
             return nil, fmt.Errorf("asset not found: %s", id)
         }

         var asset Asset
         err = json.Unmarshal(assetJSON, &asset)
         if err != nil {
             return nil, err
         }

         return &asset, nil
     }

     func main() {
         chaincode, err := contractapi.NewChaincode(new(SmartContract))
         if err != nil {
             fmt.Printf("Error creating chaincode: %s", err)
             return
         }

         if err := chaincode.Start(); err != nil {
             fmt.Printf("Error starting chaincode: %s", err)
         }
     }
     ```

2. **Deploy the Chaincode**
   - Package the chaincode and deploy it on the network:
     ```bash
     ./network.sh deployCC -ccn asset-management -ccp ../chaincode/asset-management/go -ccl go
     ```

---

### Part 3: Test the Smart Contract

1. **Build a Node.js Client**
   - Create a `client` directory under `test-network` and initialize a Node.js application:
     ```bash
     mkdir client && cd client
     npm init -y
     npm install fabric-network
     ```

   - Write a script (`app.js`) to interact with the chaincode:
     ```javascript
     const { Gateway, Wallets } = require('fabric-network');
     const path = require('path');
     const fs = require('fs');

     async function main() {
         try {
             const ccpPath = path.resolve(__dirname, '..', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
             const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

             const walletPath = path.join(process.cwd(), 'wallet');
             const wallet = await Wallets.newFileSystemWallet(walletPath);

             const gateway = new Gateway();
             await gateway.connect(ccp, {
                 wallet,
                 identity: 'appUser',
                 discovery: { enabled: true, asLocalhost: true }
             });

             const network = await gateway.getNetwork('mychannel');
             const contract = network.getContract('asset-management');

             await contract.submitTransaction('CreateAsset', 'asset1', 'Alice', 100);
             console.log('Transaction has been submitted');

             const result = await contract.evaluateTransaction('ReadAsset', 'asset1');
             console.log(`Asset details: ${result.toString()}`);

             await gateway.disconnect();
         } catch (error) {
             console.error(`Failed to submit transaction: ${error}`);
         }
     }

     main();
     ```

---

### Part 4: Documentation

1. **Create report.rst**
   - Briefly provide the steps implemented.
   - Document the steps to set up, run, and test the application.
   - Include details about the chaincode, client application, and expected outputs.

2. **Submit the Assignment**
   - Push all your changes to the GitHub repository.
   - Share the repository link.

---

## Deliverables
1. GitHub repository link with the completed project code files and a report.rst file
