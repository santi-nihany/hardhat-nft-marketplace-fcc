const { ethers, network } = require("hardhat");
const { moveBlocks } = require("../utils/move-blocks");

const TOKEN_ID = 0;

async function cancel() {
    const nftMarketplace = await ethers.getContract("NftMarketPlace");
    const basicNft = await ethers.getContract("BasicNft");

    console.log("Canceling NFT...");
    const cancelTx = await nftMarketplace.cancelListing(basicNft.address, TOKEN_ID);
    await cancelTx.wait(1);
    console.log("NFT Canceled!!");

    if (network.config.chainId == "31337") {
        await moveBlocks(1, (sleepAmount = 1000));
    }
}

cancel()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
