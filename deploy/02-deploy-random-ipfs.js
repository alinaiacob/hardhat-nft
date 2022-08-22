const{network, ethers}=require("hardhat")
const{developmentChains, networkConfig}=require("../helper-hardhat-config")
const{verify}=require("../utils/verify")
const {storeImages,storeTokenUriMetadata}=require("../utils/uploadToPinata")
const imagesLocation="../hardhat-nft-fcc/images/randomNft"
const metadataTemplate={
    name:"",
    description:"",
    images:"",
    attributes:[
       {
        trait_type:"Cuteness",
        value:100,
       },
    ],
}
let tokenUris=[
    'ipfs://Qmcz47dLfyquXsPv1KV69i4jrHLqVLdgdtAZ39Pwj9Zuec',
    'ipfs://QmfM78xuxRXuxzznwrxGf4Z5w7vZqCpKPTa8L7oexcPotE',
    'ipfs://QmeC4r5YNuN6Xg24XSsZGdMy4D2GkXLXaSLkUsygGMBcfX'
  ];
  const FUND_AMOUNT="100000000000000000"
module.exports=async function({getNamedAccounts,deployments}){
    const {deploy,log}=deployments;
    const{deployer}=await getNamedAccounts()

    const chainId=network.config.chainId;
   
    //get the ipfs hashes of our images
    if(process.env.UPLOAD_TO_PINATA==="true"){
       tokenUris=await handleTokenUris()

    }

    let vrfCoordinatorV2Address,subscriptionId;

    if(developmentChains.includes(network.name)){///dev chaim
        const vrfCoordinatorV2Mock=await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address=vrfCoordinatorV2Mock.address;
        const tx=await vrfCoordinatorV2Mock.createSubscription()
        const txReceipt=await tx.wait(1)
        subscriptionId=txReceipt.events[0].args.subId;
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId,FUND_AMOUNT)
    }else{
        vrfCoordinatorV2Address=networkConfig[chainId].vrfCoordinatorV2;
        subscriptionId=networkConfig[chainId].subscriptionId
    }
    log("---------------------------")
    await storeImages(imagesLocation)
   const args=[
        vrfCoordinatorV2Address,
        subscriptionId,
        networkConfig[chainId].gasLane,
        networkConfig[chainId].callbackGasLimit,
        tokenUris,
        networkConfig[chainId].mintFee]

    const randomIpfsNft=await deploy("RandomIpfsNft",{
        from:deployer,
        args:args,
        log:true,
        waitConfirmations:network.config.blockConfirmations || 1
    })    
    log("----------------------------")
    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY){
        log("Verifying")
        await verify(randomIpfsNft.address,args)
    }


}
async function handleTokenUris(){
    tokenUris=[]
    //store the Image in IPFS
    //Store the metadata in IPFS
    const{responses:imageUploadResponses,files}=await storeImages(imagesLocation)
    for(imageUploadResponseIndex in imageUploadResponses){
        //create metadata
        //upload the metadata
        let tokenUriMetadata={...metadataTemplate}
        tokenUriMetadata.name=files[imageUploadResponseIndex].replace(".png","")
        tokenUriMetadata.description=`An adorable ${tokenUriMetadata.name} pup!`
        tokenUriMetadata.images=`ipfs://${imageUploadResponses[imageUploadResponseIndex].ipfsHash}`
        console.log(`Uploading ${tokenUriMetadata.name}....`)
        //store the JSON to pinata/IPFS
        const metadataUploadResponse=await storeTokenUriMetadata(tokenUriMetadata)
        tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`)
    }
    console.log('Token Uris uploaded!They are:')
    console.log(tokenUris)
    return tokenUris
}
module.exports.tags=["all","randomipfs","main"]