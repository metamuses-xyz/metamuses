// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title MuseAI
 * @dev NFT contract for MetaMuses AI companions
 * Features:
 * - Limited supply of 5000 NFTs
 * - One NFT per wallet limit
 * - Enumerable for easy querying
 * - Configurable token metadata
 * - Time-gated minting with start and end dates
 */
contract MuseAI is ERC721Enumerable, Ownable {
    using Strings for uint256;

    uint256 public constant MAX_SUPPLY = 5000;
    uint256 private _tokenIdCounter;

    uint256 public mintStartTime;
    uint256 public mintEndTime;

    string private _baseTokenURI;

    mapping(address => bool) public hasMinted;

    event MintTimeUpdated(uint256 startTime, uint256 endTime);
    event BaseURIUpdated(string newBaseURI);

    modifier mintingActive() {
        require(block.timestamp >= mintStartTime, "Minting has not started yet");
        require(block.timestamp <= mintEndTime, "Minting has ended");
        _;
    }

    constructor(
        string memory baseURI,
        uint256 _mintStartTime,
        uint256 _mintEndTime
    ) ERC721("MetaMuses AI", "MUSEAI") Ownable(msg.sender) {
        require(_mintStartTime < _mintEndTime, "Invalid mint times");

        _baseTokenURI = baseURI;
        mintStartTime = _mintStartTime;
        mintEndTime = _mintEndTime;

        emit BaseURIUpdated(baseURI);
        emit MintTimeUpdated(_mintStartTime, _mintEndTime);
    }

    /**
     * @dev Mint a new MuseAI NFT
     * @param to Address to receive the NFT
     */
    function mint(address to) external mintingActive {
        require(_tokenIdCounter < MAX_SUPPLY, "Max supply reached");
        require(!hasMinted[to], "Address has already minted");

        hasMinted[to] = true;

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);
    }

    /**
     * @dev Batch mint multiple MuseAI NFTs (Owner only)
     * @param to Address to receive the NFTs
     * @param quantity Number of NFTs to mint
     */
    function batchMint(address to, uint256 quantity) external onlyOwner {
        require(_tokenIdCounter + quantity <= MAX_SUPPLY, "Exceeds max supply");

        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _tokenIdCounter;
            _tokenIdCounter++;
            _safeMint(to, tokenId);
        }
    }

    /**
     * @dev Set the base URI for token metadata
     * @param baseURI New base URI
     */
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
        emit BaseURIUpdated(baseURI);
    }

    /**
     * @dev Set the minting time window
     * @param _mintStartTime New start time (unix timestamp)
     * @param _mintEndTime New end time (unix timestamp)
     */
    function setMintTimes(uint256 _mintStartTime, uint256 _mintEndTime) external onlyOwner {
        require(_mintStartTime < _mintEndTime, "Invalid mint times");
        mintStartTime = _mintStartTime;
        mintEndTime = _mintEndTime;
        emit MintTimeUpdated(_mintStartTime, _mintEndTime);
    }

    /**
     * @dev Returns the base URI for token metadata
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Returns the token URI for a given token ID
     * @param tokenId Token ID to query
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireOwned(tokenId);

        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString(), ".json")) : "";
    }

    /**
     * @dev Returns the current token ID counter
     */
    function getCurrentTokenId() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @dev Returns whether minting is currently active
     */
    function isMintingActive() external view returns (bool) {
        return block.timestamp >= mintStartTime && block.timestamp <= mintEndTime;
    }

    /**
     * @dev Returns all token IDs owned by a specific address
     * @param owner Address to query
     */
    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);

        for (uint256 i = 0; i < tokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }

        return tokenIds;
    }
}
