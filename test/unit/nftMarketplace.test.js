const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("NFT Marketplace Unit Test", () => {
          let nftMarketplace, nftMarketplaceContract, basicNft, basicNftContract;
          const PRICE = ethers.utils.parseEther("0.1");
          const TOKEN_ID = 0;

          beforeEach(async () => {
              accounts = await ethers.getSigners(); // could also do with getNamedAccounts
              deployer = accounts[0];
              user = accounts[1];
              await deployments.fixture(["all"]);
              nftMarketplaceContract = await ethers.getContract("NftMarketPlace");
              nftMarketplace = nftMarketplaceContract.connect(deployer);
              basicNftContract = await ethers.getContract("BasicNft");
              basicNft = await basicNftContract.connect(deployer);
              await basicNft.mintNft();
              await basicNft.approve(nftMarketplaceContract.address, TOKEN_ID);
          });

          describe("List Item", function () {
              it("emits an event after listing an item", async () => {
                  expect(await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)).to.emit(
                      "ItemListed"
                  );
              });

              it("exclusively list items that haven't been listed", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
                  const error = `AlreadyListed("${basicNft.address}", ${TOKEN_ID})`;
                  console.log(error);
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith(`AlreadyListed("${basicNft.address}", ${TOKEN_ID})`);
              });

              it("exclusively allows owners to list", async () => {
                  nftMarketplace = nftMarketplaceContract.connect(user);
                  await basicNft.approve(user.address, TOKEN_ID);
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NotOwner");
              });

              it("needs approvals to list item", async function () {
                  await basicNft.approve(ethers.constants.AddressZero, TOKEN_ID);
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NotApprovedForMarketplace");
              });
              it("updates listing with seller and price", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
                  const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID);
                  assert(listing.price.toString() == PRICE.toString());
                  assert(listing.seller.toString() == deployer.address);
              });
          });

          describe("Cancel listing", function () {
              it("reverts if not listed", async () => {
                  const error = `NotListed("${basicNft.address}", ${TOKEN_ID})`;
                  await expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith(error);
              });

              it("reverts if anyone but the owner tries to call", async () => {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
                  nftMarketplace = nftMarketplaceContract.connect(user);
                  await basicNft.approve(user.address, TOKEN_ID);
                  await expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NotOwner");
              });

              it("emits event and removes listing", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
                  expect(await nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)).to.emit(
                      "ItemCanceled"
                  );
                  const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID);
                  assert(listing.price.toString() == "0");
              });
          });

          describe("buyItem", function () {
              it("reverts if the item isnt listed", async function () {
                  await expect(
                      nftMarketplace.buyItem(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NotListed");
              });
              it("reverts if the price isnt met", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
                  await expect(
                      nftMarketplace.buyItem(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("PriceNotMet");
              });
              it("transfers the nft to the buyer and updates internal proceeds record", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
                  nftMarketplace = nftMarketplaceContract.connect(user);
                  expect(
                      await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
                  ).to.emit("ItemBought");
                  const newOwner = await basicNft.ownerOf(TOKEN_ID);
                  const deployerProceeds = await nftMarketplace.getProceeds(deployer.address);
                  assert(newOwner.toString() == user.address);
                  assert(deployerProceeds.toString() == PRICE.toString());
              });
          });
      });
