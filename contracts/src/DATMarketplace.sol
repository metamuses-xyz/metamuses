// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DATMarketplace
 * @dev Marketplace for trading Data Anchoring Tokens (DATs) and purchasing inference access
 */
contract DATMarketplace is ReentrancyGuard, Ownable {
    // Access types
    enum AccessType {
        OWNERSHIP_TRANSFER,  // Transfer DAT ownership
        USAGE_BASED,        // Pay per inference
        SUBSCRIPTION        // Time-based unlimited access
    }

    // Listing structure
    struct Listing {
        address seller;
        uint256 fileId;
        AccessType accessType;
        uint256 price;          // Price in wei
        uint256 inferenceQuota; // For usage-based (0 = unlimited)
        uint256 duration;       // For subscription in seconds
        bool active;
        string metadata;        // JSON metadata URI
        uint256 totalSales;
        uint256 rating;         // Average rating * 100
        uint256 ratingCount;
    }

    // Purchase record
    struct Purchase {
        address buyer;
        uint256 listingId;
        uint256 fileId;
        AccessType accessType;
        uint256 remainingQuota; // For usage-based
        uint256 expiresAt;      // For subscription
        uint256 purchasedAt;
        bool active;
    }

    // State variables
    mapping(uint256 => Listing) public listings;
    mapping(address => mapping(uint256 => Purchase)) public purchases; // buyer => fileId => Purchase
    mapping(uint256 => uint256[]) public fileIdToListings; // fileId => listingIds
    mapping(address => uint256[]) public sellerListings;
    mapping(address => uint256[]) public buyerPurchases;

    uint256 public listingCounter;
    uint256 public platformFeePercentage = 250; // 2.5% (basis points)
    uint256 public constant BASIS_POINTS = 10000;

    address public platformWallet;
    address public accessControlContract;

    // Events
    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        uint256 indexed fileId,
        AccessType accessType,
        uint256 price
    );

    event ListingUpdated(
        uint256 indexed listingId,
        uint256 newPrice,
        bool active
    );

    event PurchaseMade(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 indexed fileId,
        AccessType accessType,
        uint256 price
    );

    event InferenceUsed(
        address indexed buyer,
        uint256 indexed fileId,
        uint256 remainingQuota
    );

    event ListingRated(
        uint256 indexed listingId,
        address indexed rater,
        uint256 rating
    );

    event PlatformFeeUpdated(uint256 newFee);

    constructor(address _platformWallet) Ownable(msg.sender) {
        require(_platformWallet != address(0), "Invalid platform wallet");
        platformWallet = _platformWallet;
    }

    /**
     * @dev Set the access control contract address
     */
    function setAccessControlContract(address _accessControl) external onlyOwner {
        require(_accessControl != address(0), "Invalid address");
        accessControlContract = _accessControl;
    }

    /**
     * @dev Create a new listing
     */
    function createListing(
        uint256 _fileId,
        AccessType _accessType,
        uint256 _price,
        uint256 _inferenceQuota,
        uint256 _duration,
        string memory _metadata
    ) external returns (uint256) {
        require(_price > 0, "Price must be greater than 0");
        require(_fileId > 0, "Invalid file ID");

        listingCounter++;
        uint256 listingId = listingCounter;

        listings[listingId] = Listing({
            seller: msg.sender,
            fileId: _fileId,
            accessType: _accessType,
            price: _price,
            inferenceQuota: _inferenceQuota,
            duration: _duration,
            active: true,
            metadata: _metadata,
            totalSales: 0,
            rating: 0,
            ratingCount: 0
        });

        fileIdToListings[_fileId].push(listingId);
        sellerListings[msg.sender].push(listingId);

        emit ListingCreated(listingId, msg.sender, _fileId, _accessType, _price);

        return listingId;
    }

    /**
     * @dev Update listing price and active status
     */
    function updateListing(
        uint256 _listingId,
        uint256 _price,
        bool _active
    ) external {
        Listing storage listing = listings[_listingId];
        require(listing.seller == msg.sender, "Not the seller");
        require(_price > 0, "Price must be greater than 0");

        listing.price = _price;
        listing.active = _active;

        emit ListingUpdated(_listingId, _price, _active);
    }

    /**
     * @dev Purchase access to a DAT
     */
    function purchaseAccess(uint256 _listingId)
        external
        payable
        nonReentrant
    {
        Listing storage listing = listings[_listingId];
        require(listing.active, "Listing not active");
        require(msg.value == listing.price, "Incorrect payment amount");

        // Calculate platform fee
        uint256 platformFee = (msg.value * platformFeePercentage) / BASIS_POINTS;
        uint256 sellerAmount = msg.value - platformFee;

        // Transfer funds
        (bool successSeller, ) = listing.seller.call{value: sellerAmount}("");
        require(successSeller, "Seller transfer failed");

        (bool successPlatform, ) = platformWallet.call{value: platformFee}("");
        require(successPlatform, "Platform fee transfer failed");

        // Create or update purchase record
        Purchase storage purchase = purchases[msg.sender][listing.fileId];

        if (listing.accessType == AccessType.USAGE_BASED) {
            purchase.remainingQuota += listing.inferenceQuota;
        } else if (listing.accessType == AccessType.SUBSCRIPTION) {
            uint256 newExpiry = block.timestamp + listing.duration;
            if (purchase.expiresAt > block.timestamp) {
                // Extend existing subscription
                purchase.expiresAt += listing.duration;
            } else {
                purchase.expiresAt = newExpiry;
            }
        }

        purchase.buyer = msg.sender;
        purchase.listingId = _listingId;
        purchase.fileId = listing.fileId;
        purchase.accessType = listing.accessType;
        purchase.purchasedAt = block.timestamp;
        purchase.active = true;

        if (!_hasPurchased(msg.sender, listing.fileId)) {
            buyerPurchases[msg.sender].push(listing.fileId);
        }

        listing.totalSales++;

        emit PurchaseMade(_listingId, msg.sender, listing.fileId, listing.accessType, listing.price);
    }

    /**
     * @dev Record inference usage (called by access control contract)
     */
    function recordInferenceUsage(address _buyer, uint256 _fileId) external {
        require(msg.sender == accessControlContract, "Only access control can call");

        Purchase storage purchase = purchases[_buyer][_fileId];
        require(purchase.active, "No active purchase");

        if (purchase.accessType == AccessType.USAGE_BASED) {
            require(purchase.remainingQuota > 0, "Quota exhausted");
            purchase.remainingQuota--;

            if (purchase.remainingQuota == 0) {
                purchase.active = false;
            }
        } else if (purchase.accessType == AccessType.SUBSCRIPTION) {
            require(block.timestamp < purchase.expiresAt, "Subscription expired");

            if (block.timestamp >= purchase.expiresAt) {
                purchase.active = false;
            }
        }

        emit InferenceUsed(_buyer, _fileId, purchase.remainingQuota);
    }

    /**
     * @dev Rate a listing
     */
    function rateListing(uint256 _listingId, uint256 _rating) external {
        require(_rating >= 1 && _rating <= 5, "Rating must be 1-5");

        Listing storage listing = listings[_listingId];
        require(listing.active, "Listing not active");

        // Check if buyer has purchased this listing
        Purchase memory purchase = purchases[msg.sender][listing.fileId];
        require(purchase.buyer == msg.sender, "Must purchase before rating");

        // Update rating (simple average * 100 for precision)
        uint256 totalRating = (listing.rating * listing.ratingCount) + (_rating * 100);
        listing.ratingCount++;
        listing.rating = totalRating / listing.ratingCount;

        emit ListingRated(_listingId, msg.sender, _rating);
    }

    /**
     * @dev Check if user has access to a file
     */
    function hasAccess(address _buyer, uint256 _fileId) external view returns (bool) {
        Purchase memory purchase = purchases[_buyer][_fileId];

        if (!purchase.active) return false;

        if (purchase.accessType == AccessType.OWNERSHIP_TRANSFER) {
            return true;
        } else if (purchase.accessType == AccessType.USAGE_BASED) {
            return purchase.remainingQuota > 0;
        } else if (purchase.accessType == AccessType.SUBSCRIPTION) {
            return block.timestamp < purchase.expiresAt;
        }

        return false;
    }

    /**
     * @dev Get purchase details
     */
    function getPurchase(address _buyer, uint256 _fileId)
        external
        view
        returns (Purchase memory)
    {
        return purchases[_buyer][_fileId];
    }

    /**
     * @dev Get all listings for a file ID
     */
    function getListingsByFileId(uint256 _fileId)
        external
        view
        returns (uint256[] memory)
    {
        return fileIdToListings[_fileId];
    }

    /**
     * @dev Get all listings by seller
     */
    function getSellerListings(address _seller)
        external
        view
        returns (uint256[] memory)
    {
        return sellerListings[_seller];
    }

    /**
     * @dev Get all purchases by buyer
     */
    function getBuyerPurchases(address _buyer)
        external
        view
        returns (uint256[] memory)
    {
        return buyerPurchases[_buyer];
    }

    /**
     * @dev Update platform fee (only owner)
     */
    function updatePlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee too high (max 10%)");
        platformFeePercentage = _newFee;
        emit PlatformFeeUpdated(_newFee);
    }

    /**
     * @dev Update platform wallet (only owner)
     */
    function updatePlatformWallet(address _newWallet) external onlyOwner {
        require(_newWallet != address(0), "Invalid address");
        platformWallet = _newWallet;
    }

    /**
     * @dev Internal helper to check if buyer has purchased a file
     */
    function _hasPurchased(address _buyer, uint256 _fileId) internal view returns (bool) {
        uint256[] memory purchasedFiles = buyerPurchases[_buyer];
        for (uint256 i = 0; i < purchasedFiles.length; i++) {
            if (purchasedFiles[i] == _fileId) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Get listing details
     */
    function getListing(uint256 _listingId) external view returns (Listing memory) {
        return listings[_listingId];
    }
}
