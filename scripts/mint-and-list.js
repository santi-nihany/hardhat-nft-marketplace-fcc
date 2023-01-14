const { ethers, network } = require("hardhat");
const { moveBlocks } = require("../utils/move-blocks");

const PRICE = ethers.utils.parseEther("0.1");

async function mintAndList() {
    const nftMarketplace = await ethers.getContract("NftMarketPlace");
    const basicNft = await ethers.getContract("BasicNft");

    console.log("Minting NFT...");
    const mintTx = await basicNft.mintNft();
    const mintTxReceipt = await mintTx.wait(1);
    const tokenId = mintTxReceipt.events[0].args.tokenId;

    console.log("Approving NFT...");
    const approvalTx = await basicNft.approve(nftMarketplace.address, tokenId);
    await approvalTx.wait(1);

    console.log("Listing NFT...");
    const listTx = await nftMarketplace.listItem(basicNft.address, tokenId, PRICE);
    await listTx.wait(1);

    console.log(`Listed!! TokenId ${tokenId}`);

    if (network.config.chainId == 31337) {
        await moveBlocks(1, (sleepAmount = 1000));
    }
}

mintAndList()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
