// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title MuseAI
 * @dev NFT contract for MetaMuses AI companions
 * Features:
 * - Limited supply of 5000 NFTs
 * - One NFT per wallet limit
 * - Enumerable for easy querying
 * - Configurable token metadata
 * - Time-gated minting with start and end dates
 * - Gasless minting with EIP-712 signatures
 */
contract MuseAI is ERC721Enumerable, Ownable {
    using Strings for uint256;
    using ECDSA for bytes32;

    uint256 public constant MAX_SUPPLY = 5000;
    uint256 private _tokenIdCounter;

    uint256 public mintStartTime;
    uint256 public mintEndTime;

    string private _baseTokenURI;

    mapping(address => bool) public hasMinted;

    // EIP-712 Domain Separator
    bytes32 public DOMAIN_SEPARATOR;

    // Typehash for MintRequest
    bytes32 public constant MINT_REQUEST_TYPEHASH =
        keccak256("MintRequest(address to,uint256 nonce)");

    // Nonce tracking for replay protection
    mapping(address => uint256) public nonces;

    // Authorized backend minter address
    address public backendMinter;

    event MintTimeUpdated(uint256 startTime, uint256 endTime);
    event BaseURIUpdated(string newBaseURI);
    event BackendMinterUpdated(address indexed oldMinter, address indexed newMinter);
    event GaslessMint(address indexed to, uint256 indexed tokenId, uint256 nonce);
    event AdminMint(address indexed to, uint256 indexed tokenId, address indexed admin);

    modifier mintingActive() {
        require(block.timestamp >= mintStartTime, "Minting has not started yet");
        require(block.timestamp <= mintEndTime, "Minting has ended");
        _;
    }

    constructor(
        string memory baseURI,
        uint256 _mintStartTime,
        uint256 _mintEndTime,
        address _backendMinter
    ) ERC721("MetaMuses AI", "MUSEAI") {
        require(_mintStartTime < _mintEndTime, "Invalid mint times");
        require(_backendMinter != address(0), "Invalid backend minter");

        _baseTokenURI = baseURI;
        mintStartTime = _mintStartTime;
        mintEndTime = _mintEndTime;
        backendMinter = _backendMinter;

        // Initialize EIP-712 domain separator
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("MetaMuses AI")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );

        emit BaseURIUpdated(baseURI);
        emit MintTimeUpdated(_mintStartTime, _mintEndTime);
        emit BackendMinterUpdated(address(0), _backendMinter);
    }

    /**
     * @dev Gasless mint with EIP-712 signature
     * @param to Address to receive the NFT
     * @param nonce Nonce for replay protection
     * @param signature User's EIP-712 signature
     */
    function mintWithSignature(
        address to,
        uint256 nonce,
        bytes memory signature
    ) external mintingActive {
        require(msg.sender == backendMinter, "Only backend minter can call");
        require(_tokenIdCounter < MAX_SUPPLY, "Max supply reached");
        require(!hasMinted[to], "Address has already minted");
        require(nonce == nonces[to], "Invalid nonce");

        // Verify signature
        bytes32 structHash = keccak256(abi.encode(MINT_REQUEST_TYPEHASH, to, nonce));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
        address signer = digest.recover(signature);

        require(signer == to, "Invalid signature");

        // Increment nonce
        nonces[to]++;

        // Mark as minted
        hasMinted[to] = true;

        // Mint token
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);

        emit GaslessMint(to, tokenId, nonce);
    }

    /**
     * @dev Set the backend minter address
     * @param _backendMinter New backend minter address
     */
    function setBackendMinter(address _backendMinter) external onlyOwner {
        require(_backendMinter != address(0), "Invalid backend minter");
        address oldMinter = backendMinter;
        backendMinter = _backendMinter;
        emit BackendMinterUpdated(oldMinter, _backendMinter);
    }

    /**
     * @dev Get the current nonce for an address
     * @param user Address to query
     */
    function getNonce(address user) external view returns (uint256) {
        return nonces[user];
    }

    /**
     * @dev Admin mint a single NFT to any recipient (Owner only)
     * Bypasses minting restrictions (time window, hasMinted check)
     * Useful for airdrops, giveaways, team allocation, etc.
     * @param to Address to receive the NFT
     */
    function adminMint(address to) external onlyOwner {
        require(_tokenIdCounter < MAX_SUPPLY, "Max supply reached");
        require(to != address(0), "Cannot mint to zero address");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);

        emit AdminMint(to, tokenId, msg.sender);

        // Note: Does NOT set hasMinted[to] = true
        // This allows admin to mint multiple NFTs to the same address if needed
        // Also allows the recipient to still use their free mint later
    }

    /**
     * @dev Batch mint multiple MuseAI NFTs (Owner only)
     * @param to Address to receive the NFTs
     * @param quantity Number of NFTs to mint
     */
    function batchMint(address to, uint256 quantity) external onlyOwner {
        require(_tokenIdCounter + quantity <= MAX_SUPPLY, "Exceeds max supply");
        require(to != address(0), "Cannot mint to zero address");

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
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

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
