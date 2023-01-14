const { ethers, network } = require("hardhat");
const { moveBlocks, sleep } = require("../utils/move-blocks");

const TOKEN_ID = 0;

async function buy() {
    const nftMarketplace = await ethers.getContract("NftMarketPlace");
    const basicNft = await ethers.getContract("BasicNft");
    const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID);
    const price = listing.price.toString();

    console.log("Buying NFT...");
    const buyTx = await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, { value: price });
    await buyTx.wait(1);
    console.log("Bought NFT!!");

    if (network.config.chainId == "31337") {
        await moveBlocks(1, (sleepAmount = 1000));
    }
}

buy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
