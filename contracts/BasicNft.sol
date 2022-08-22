//SPDX-License-Identifier:MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
contract BasicNft is ERC721{
    uint private s_tokenCounter;
     string public constant TOKEN_URI =
        "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json";
   constructor() ERC721("Dogie","DOG"){
     s_tokenCounter=0;
   }

   function mintNft() public returns(uint256){
      _safeMint(msg.sender,s_tokenCounter);
      s_tokenCounter++;
      return s_tokenCounter;
   }
   function tokenURI(uint256 tokenId) public view override returns(string memory){
    return TOKEN_URI;
   }
   function getToken()public view returns(uint256){
     return s_tokenCounter;
   }
}