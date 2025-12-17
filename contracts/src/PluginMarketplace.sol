// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPluginMarketplace.sol";

/**
 * @title PluginMarketplace
 * @notice On-chain marketplace for AI Companion plugins
 * @dev Enables plugin creators to monetize and users to enhance their AI companions
 *      with capabilities like Language Tutor, Code Assistant Pro, Health Coach, etc.
 */
contract PluginMarketplace is IPluginMarketplace, ReentrancyGuard, Ownable {
    // ============ Constants ============

    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MAX_PLATFORM_FEE = 1000; // 10%
    uint256 public constant MAX_RATING = 5;

    // ============ State Variables ============

    // Core storage
    mapping(uint256 => Plugin) private _plugins;
    mapping(uint256 => PluginVersion[]) private _pluginVersions;
    mapping(uint256 => PluginListing[]) private _pluginListings;

    // Installation tracking (museId => pluginId => Installation)
    mapping(uint256 => mapping(uint256 => Installation)) private _installations;
    mapping(uint256 => uint256[]) private _musePluginList;

    // Creator & earnings
    mapping(address => uint256[]) private _creatorPlugins;
    mapping(address => uint256) private _creatorEarnings;
    mapping(uint256 => uint256) private _pluginEarnings;

    // User ratings (pluginId => user => rating)
    mapping(uint256 => mapping(address => uint8)) private _userRatings;
    mapping(uint256 => mapping(address => bool)) private _hasRated;

    // Platform configuration
    uint256 public pluginCounter;
    uint256 public platformFee = 250; // 2.5%
    address public platformWallet;
    address public museNFT;
    address public usageTracker;
    address public companionFactory;

    // ============ Modifiers ============

    modifier onlyMuseOwner(uint256 _museId) {
        require(museNFT != address(0), "MuseNFT not set");
        // Allow either the NFT owner or their companion contract to call
        bool isOwner = IERC721(museNFT).ownerOf(_museId) == msg.sender;
        bool isCompanion = _isCompanionForToken(_museId, msg.sender);
        require(isOwner || isCompanion, "Not muse owner");
        _;
    }

    modifier onlyPluginCreator(uint256 _pluginId) {
        require(_pluginId > 0 && _pluginId <= pluginCounter, "Invalid plugin");
        require(_plugins[_pluginId].creator == msg.sender, "Not plugin creator");
        _;
    }

    modifier validPlugin(uint256 _pluginId) {
        require(_pluginId > 0 && _pluginId <= pluginCounter, "Invalid plugin");
        require(_plugins[_pluginId].active, "Plugin not active");
        _;
    }

    // ============ Constructor ============

    constructor(address _museNFT, address _platformWallet) {
        require(_platformWallet != address(0), "Invalid platform wallet");
        museNFT = _museNFT;
        platformWallet = _platformWallet;
    }

    // ============ Plugin Management ============

    /**
     * @notice Register a new plugin in the marketplace
     * @param _name Plugin name
     * @param _metadataURI IPFS link to plugin metadata
     * @param _wasmHash IPFS hash of WASM module
     * @param _category Plugin category
     * @return pluginId The ID of the newly registered plugin
     */
    function registerPlugin(
        string memory _name,
        string memory _metadataURI,
        string memory _wasmHash,
        Category _category
    ) external returns (uint256 pluginId) {
        require(bytes(_name).length > 0, "Empty name");
        require(bytes(_metadataURI).length > 0, "Empty metadata URI");
        require(bytes(_wasmHash).length > 0, "Empty WASM hash");

        pluginCounter++;
        pluginId = pluginCounter;

        _plugins[pluginId] = Plugin({
            id: pluginId,
            name: _name,
            metadataURI: _metadataURI,
            wasmHash: _wasmHash,
            creator: msg.sender,
            category: _category,
            currentVersion: 1,
            createdAt: block.timestamp,
            active: true,
            totalInstalls: 0,
            totalRevenue: 0,
            rating: 0,
            ratingCount: 0
        });

        // Store initial version
        _pluginVersions[pluginId].push(PluginVersion({
            version: 1,
            wasmHash: _wasmHash,
            changelog: "Initial release",
            releaseDate: block.timestamp,
            deprecated: false
        }));

        _creatorPlugins[msg.sender].push(pluginId);

        emit PluginRegistered(pluginId, msg.sender, _name, _category);
    }

    /**
     * @notice Create a pricing listing for a plugin
     * @param _pluginId Plugin ID
     * @param _accessType Type of access (PERMANENT, SUBSCRIPTION, USAGE_BASED)
     * @param _price Price in wei
     * @param _usageQuota Number of uses for USAGE_BASED (0 for others)
     * @param _duration Duration in seconds for SUBSCRIPTION (0 for others)
     * @param _trialDuration Trial period in seconds (0 = no trial)
     * @return listingId The ID of the newly created listing
     */
    function createListing(
        uint256 _pluginId,
        AccessType _accessType,
        uint256 _price,
        uint256 _usageQuota,
        uint256 _duration,
        uint256 _trialDuration
    ) external onlyPluginCreator(_pluginId) returns (uint256 listingId) {
        // Validate based on access type
        if (_accessType == AccessType.SUBSCRIPTION) {
            require(_duration > 0, "Duration required for subscription");
        } else if (_accessType == AccessType.USAGE_BASED) {
            require(_usageQuota > 0, "Quota required for usage-based");
        }

        PluginListing memory listing = PluginListing({
            pluginId: _pluginId,
            accessType: _accessType,
            price: _price,
            usageQuota: _usageQuota,
            duration: _duration,
            trialDuration: _trialDuration,
            active: true
        });

        _pluginListings[_pluginId].push(listing);
        listingId = _pluginListings[_pluginId].length - 1;

        emit ListingCreated(_pluginId, listingId, _accessType, _price);
    }

    /**
     * @notice Update a listing's price and active status
     */
    function updateListing(
        uint256 _pluginId,
        uint256 _listingId,
        uint256 _price,
        bool _active
    ) external onlyPluginCreator(_pluginId) {
        require(_listingId < _pluginListings[_pluginId].length, "Invalid listing");

        PluginListing storage listing = _pluginListings[_pluginId][_listingId];
        listing.price = _price;
        listing.active = _active;

        emit ListingUpdated(_pluginId, _listingId, _price, _active);
    }

    /**
     * @notice Publish a new version of the plugin
     * @param _pluginId Plugin ID
     * @param _wasmHash New WASM hash
     * @param _changelog Description of changes
     * @return version The new version number
     */
    function publishVersion(
        uint256 _pluginId,
        string memory _wasmHash,
        string memory _changelog
    ) external onlyPluginCreator(_pluginId) returns (uint256 version) {
        require(bytes(_wasmHash).length > 0, "Empty WASM hash");

        Plugin storage plugin = _plugins[_pluginId];
        plugin.currentVersion++;
        plugin.wasmHash = _wasmHash;
        version = plugin.currentVersion;

        _pluginVersions[_pluginId].push(PluginVersion({
            version: version,
            wasmHash: _wasmHash,
            changelog: _changelog,
            releaseDate: block.timestamp,
            deprecated: false
        }));

        emit VersionPublished(_pluginId, version, _wasmHash);
    }

    /**
     * @notice Deprecate an old version
     */
    function deprecateVersion(
        uint256 _pluginId,
        uint256 _version
    ) external onlyPluginCreator(_pluginId) {
        require(_version > 0 && _version <= _plugins[_pluginId].currentVersion, "Invalid version");
        require(_version < _plugins[_pluginId].currentVersion, "Cannot deprecate current version");

        _pluginVersions[_pluginId][_version - 1].deprecated = true;
    }

    /**
     * @notice Deactivate a plugin (creator or owner)
     */
    function deactivatePlugin(uint256 _pluginId) external {
        require(_pluginId > 0 && _pluginId <= pluginCounter, "Invalid plugin");
        require(
            _plugins[_pluginId].creator == msg.sender || owner() == msg.sender,
            "Not authorized"
        );

        _plugins[_pluginId].active = false;
    }

    // ============ Installation ============

    /**
     * @notice Install a plugin on a Muse (with payment)
     * @param _museId The Muse NFT token ID
     * @param _pluginId The plugin to install
     * @param _listingId The pricing listing to use
     */
    function installPlugin(
        uint256 _museId,
        uint256 _pluginId,
        uint256 _listingId
    ) external payable nonReentrant onlyMuseOwner(_museId) validPlugin(_pluginId) {
        require(_listingId < _pluginListings[_pluginId].length, "Invalid listing");

        PluginListing memory listing = _pluginListings[_pluginId][_listingId];
        require(listing.active, "Listing not active");
        require(msg.value >= listing.price, "Insufficient payment");

        Installation storage installation = _installations[_museId][_pluginId];

        // Handle different access types
        if (listing.accessType == AccessType.PERMANENT) {
            require(!installation.active, "Already installed");
            _createInstallation(_museId, _pluginId, _listingId, listing);
        } else if (listing.accessType == AccessType.SUBSCRIPTION) {
            _handleSubscriptionInstall(_museId, _pluginId, _listingId, listing, installation);
        } else if (listing.accessType == AccessType.USAGE_BASED) {
            _handleUsageBasedInstall(_museId, _pluginId, _listingId, listing, installation);
        }

        // Process payment
        if (listing.price > 0) {
            _processPayment(_pluginId, listing.price);
        }

        // Refund excess
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }

        // Update stats
        Plugin storage plugin = _plugins[_pluginId];
        plugin.totalInstalls++;
        plugin.totalRevenue += listing.price;

        emit PluginInstalled(_museId, _pluginId, _listingId, listing.accessType, listing.price);
    }

    /**
     * @notice Start a free trial for a plugin
     */
    function startTrial(
        uint256 _museId,
        uint256 _pluginId,
        uint256 _listingId
    ) external onlyMuseOwner(_museId) validPlugin(_pluginId) {
        require(_listingId < _pluginListings[_pluginId].length, "Invalid listing");

        PluginListing memory listing = _pluginListings[_pluginId][_listingId];
        require(listing.active, "Listing not active");
        require(listing.trialDuration > 0, "No trial available");

        Installation storage installation = _installations[_museId][_pluginId];
        require(!installation.active, "Already installed");
        require(installation.trialEndsAt == 0, "Trial already used");

        // Create trial installation
        installation.museId = _museId;
        installation.pluginId = _pluginId;
        installation.listingId = _listingId;
        installation.accessType = listing.accessType;
        installation.version = _plugins[_pluginId].currentVersion;
        installation.installedAt = block.timestamp;
        installation.trialEndsAt = block.timestamp + listing.trialDuration;
        installation.active = true;

        // Set trial-specific fields
        if (listing.accessType == AccessType.SUBSCRIPTION) {
            installation.expiresAt = installation.trialEndsAt;
        } else if (listing.accessType == AccessType.USAGE_BASED) {
            installation.remainingQuota = listing.usageQuota;
        }

        // Add to muse's plugin list
        if (!_isPluginInList(_museId, _pluginId)) {
            _musePluginList[_museId].push(_pluginId);
        }

        emit TrialStarted(_museId, _pluginId, installation.trialEndsAt);
    }

    /**
     * @notice Upgrade to the latest version
     */
    function upgradePlugin(
        uint256 _museId,
        uint256 _pluginId
    ) external onlyMuseOwner(_museId) validPlugin(_pluginId) {
        Installation storage installation = _installations[_museId][_pluginId];
        require(installation.active, "Not installed");

        uint256 currentVersion = installation.version;
        uint256 latestVersion = _plugins[_pluginId].currentVersion;
        require(currentVersion < latestVersion, "Already on latest version");

        installation.version = latestVersion;

        emit PluginUpgraded(_museId, _pluginId, currentVersion, latestVersion);
    }

    /**
     * @notice Uninstall a plugin
     */
    function uninstallPlugin(
        uint256 _museId,
        uint256 _pluginId
    ) external onlyMuseOwner(_museId) {
        Installation storage installation = _installations[_museId][_pluginId];
        require(installation.active, "Not installed");

        installation.active = false;

        // Remove from muse's plugin list
        _removeFromPluginList(_museId, _pluginId);

        emit PluginUninstalled(_museId, _pluginId);
    }

    /**
     * @notice Renew a subscription
     */
    function renewSubscription(
        uint256 _museId,
        uint256 _pluginId,
        uint256 _listingId
    ) external payable nonReentrant onlyMuseOwner(_museId) validPlugin(_pluginId) {
        require(_listingId < _pluginListings[_pluginId].length, "Invalid listing");

        PluginListing memory listing = _pluginListings[_pluginId][_listingId];
        require(listing.active, "Listing not active");
        require(listing.accessType == AccessType.SUBSCRIPTION, "Not a subscription listing");
        require(msg.value >= listing.price, "Insufficient payment");

        Installation storage installation = _installations[_museId][_pluginId];
        require(installation.accessType == AccessType.SUBSCRIPTION, "Not subscription access");

        // Extend subscription
        if (installation.expiresAt > block.timestamp) {
            installation.expiresAt += listing.duration;
        } else {
            installation.expiresAt = block.timestamp + listing.duration;
            installation.active = true;
        }
        installation.trialEndsAt = 0; // Clear trial status

        // Process payment
        _processPayment(_pluginId, listing.price);

        // Refund excess
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }

        // Update stats
        _plugins[_pluginId].totalRevenue += listing.price;

        emit SubscriptionRenewed(_museId, _pluginId, installation.expiresAt);
    }

    /**
     * @notice Purchase additional usage quota
     */
    function purchaseQuota(
        uint256 _museId,
        uint256 _pluginId,
        uint256 _listingId
    ) external payable nonReentrant onlyMuseOwner(_museId) validPlugin(_pluginId) {
        require(_listingId < _pluginListings[_pluginId].length, "Invalid listing");

        PluginListing memory listing = _pluginListings[_pluginId][_listingId];
        require(listing.active, "Listing not active");
        require(listing.accessType == AccessType.USAGE_BASED, "Not usage-based listing");
        require(msg.value >= listing.price, "Insufficient payment");

        Installation storage installation = _installations[_museId][_pluginId];
        require(installation.accessType == AccessType.USAGE_BASED, "Not usage-based access");

        // Add quota
        installation.remainingQuota += listing.usageQuota;
        installation.active = true;
        installation.trialEndsAt = 0; // Clear trial status

        // Process payment
        _processPayment(_pluginId, listing.price);

        // Refund excess
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }

        // Update stats
        _plugins[_pluginId].totalRevenue += listing.price;

        emit QuotaPurchased(_museId, _pluginId, listing.usageQuota, installation.remainingQuota);
    }

    // ============ Usage Tracking ============

    /**
     * @notice Record plugin usage (called by authorized backend)
     */
    function recordUsage(uint256 _museId, uint256 _pluginId) external {
        require(msg.sender == usageTracker || msg.sender == owner(), "Not authorized");

        Installation storage installation = _installations[_museId][_pluginId];
        require(installation.active, "Not installed");

        // Check trial expiration
        if (installation.trialEndsAt > 0 && block.timestamp > installation.trialEndsAt) {
            installation.active = false;
            revert("Trial expired");
        }

        // Handle usage-based access
        if (installation.accessType == AccessType.USAGE_BASED) {
            require(installation.remainingQuota > 0, "Quota exhausted");
            installation.remainingQuota--;

            if (installation.remainingQuota == 0) {
                installation.active = false;
            }
        }
        // Handle subscription access
        else if (installation.accessType == AccessType.SUBSCRIPTION) {
            require(block.timestamp < installation.expiresAt, "Subscription expired");
        }
        // PERMANENT access always valid if active

        emit UsageRecorded(_museId, _pluginId, installation.remainingQuota);
    }

    /**
     * @notice Check if a Muse has active access to a plugin
     */
    function hasAccess(uint256 _museId, uint256 _pluginId) external view returns (bool) {
        Installation memory installation = _installations[_museId][_pluginId];

        if (!installation.active) return false;

        // Check trial
        if (installation.trialEndsAt > 0 && block.timestamp > installation.trialEndsAt) {
            return false;
        }

        // Check based on access type
        if (installation.accessType == AccessType.PERMANENT) {
            return true;
        } else if (installation.accessType == AccessType.SUBSCRIPTION) {
            return block.timestamp < installation.expiresAt;
        } else if (installation.accessType == AccessType.USAGE_BASED) {
            return installation.remainingQuota > 0;
        }

        return false;
    }

    /**
     * @notice Get installation details
     */
    function getInstallation(
        uint256 _museId,
        uint256 _pluginId
    ) external view returns (Installation memory) {
        return _installations[_museId][_pluginId];
    }

    // ============ Rating & Discovery ============

    /**
     * @notice Rate a plugin (1-5 stars)
     */
    function ratePlugin(uint256 _pluginId, uint8 _rating) external validPlugin(_pluginId) {
        require(_rating >= 1 && _rating <= MAX_RATING, "Rating must be 1-5");
        require(!_hasRated[_pluginId][msg.sender], "Already rated");

        // Verify user owns at least one Muse NFT (simplified check)
        // In production, could verify they have installed this specific plugin
        if (museNFT != address(0)) {
            require(
                IERC721(museNFT).balanceOf(msg.sender) > 0,
                "Must own a Muse to rate"
            );
        }

        Plugin storage plugin = _plugins[_pluginId];

        // Update rating (rolling average * 100 for precision)
        uint256 ratingValue = uint256(_rating) * 100;
        uint256 totalRating = (plugin.rating * plugin.ratingCount) + ratingValue;
        plugin.ratingCount++;
        plugin.rating = totalRating / plugin.ratingCount;

        _userRatings[_pluginId][msg.sender] = _rating;
        _hasRated[_pluginId][msg.sender] = true;

        emit PluginRated(_pluginId, msg.sender, _rating);
    }

    /**
     * @notice Get plugins by category
     */
    function getPluginsByCategory(Category _category) external view returns (uint256[] memory) {
        // Count plugins in category
        uint256 count = 0;
        for (uint256 i = 1; i <= pluginCounter; i++) {
            if (_plugins[i].category == _category && _plugins[i].active) {
                count++;
            }
        }

        // Build result array
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= pluginCounter; i++) {
            if (_plugins[i].category == _category && _plugins[i].active) {
                result[index] = i;
                index++;
            }
        }

        return result;
    }

    /**
     * @notice Get top rated plugins
     */
    function getTopPlugins(uint256 _limit) external view returns (uint256[] memory) {
        // Get all active plugins
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= pluginCounter; i++) {
            if (_plugins[i].active) {
                activeCount++;
            }
        }

        uint256 resultSize = _limit < activeCount ? _limit : activeCount;
        uint256[] memory result = new uint256[](resultSize);
        uint256[] memory ratings = new uint256[](resultSize);

        // Simple insertion sort for top N
        for (uint256 i = 1; i <= pluginCounter; i++) {
            if (!_plugins[i].active) continue;

            uint256 rating = _plugins[i].rating;

            // Find position to insert
            for (uint256 j = 0; j < resultSize; j++) {
                if (rating > ratings[j]) {
                    // Shift down
                    for (uint256 k = resultSize - 1; k > j; k--) {
                        result[k] = result[k - 1];
                        ratings[k] = ratings[k - 1];
                    }
                    result[j] = i;
                    ratings[j] = rating;
                    break;
                }
            }
        }

        return result;
    }

    /**
     * @notice Get creator's plugins
     */
    function getCreatorPlugins(address _creator) external view returns (uint256[] memory) {
        return _creatorPlugins[_creator];
    }

    // ============ Getters ============

    function getPlugin(uint256 _pluginId) external view returns (Plugin memory) {
        require(_pluginId > 0 && _pluginId <= pluginCounter, "Invalid plugin");
        return _plugins[_pluginId];
    }

    function getPluginVersion(
        uint256 _pluginId,
        uint256 _version
    ) external view returns (PluginVersion memory) {
        require(_pluginId > 0 && _pluginId <= pluginCounter, "Invalid plugin");
        require(_version > 0 && _version <= _plugins[_pluginId].currentVersion, "Invalid version");
        return _pluginVersions[_pluginId][_version - 1];
    }

    function getPluginListings(uint256 _pluginId) external view returns (PluginListing[] memory) {
        return _pluginListings[_pluginId];
    }

    function getMusePlugins(uint256 _museId) external view returns (uint256[] memory) {
        return _musePluginList[_museId];
    }

    // ============ Earnings ============

    /**
     * @notice Withdraw creator earnings
     */
    function withdrawEarnings() external nonReentrant {
        uint256 earnings = _creatorEarnings[msg.sender];
        require(earnings > 0, "No earnings to withdraw");

        _creatorEarnings[msg.sender] = 0;
        payable(msg.sender).transfer(earnings);

        emit EarningsWithdrawn(msg.sender, earnings);
    }

    function getCreatorEarnings(address _creator) external view returns (uint256) {
        return _creatorEarnings[_creator];
    }

    // ============ Admin Functions ============

    function setPlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= MAX_PLATFORM_FEE, "Fee too high");
        platformFee = _newFee;
        emit PlatformFeeUpdated(_newFee);
    }

    function setPlatformWallet(address _newWallet) external onlyOwner {
        require(_newWallet != address(0), "Invalid address");
        platformWallet = _newWallet;
    }

    function setMuseNFT(address _museNFT) external onlyOwner {
        museNFT = _museNFT;
    }

    function setUsageTracker(address _tracker) external onlyOwner {
        usageTracker = _tracker;
    }

    function setCompanionFactory(address _factory) external onlyOwner {
        companionFactory = _factory;
    }

    function withdrawPlatformFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(platformWallet).transfer(balance);
    }

    // ============ Internal Functions ============

    function _createInstallation(
        uint256 _museId,
        uint256 _pluginId,
        uint256 _listingId,
        PluginListing memory listing
    ) internal {
        Installation storage installation = _installations[_museId][_pluginId];

        installation.museId = _museId;
        installation.pluginId = _pluginId;
        installation.listingId = _listingId;
        installation.accessType = listing.accessType;
        installation.version = _plugins[_pluginId].currentVersion;
        installation.installedAt = block.timestamp;
        installation.active = true;

        if (listing.accessType == AccessType.SUBSCRIPTION) {
            installation.expiresAt = block.timestamp + listing.duration;
        } else if (listing.accessType == AccessType.USAGE_BASED) {
            installation.remainingQuota = listing.usageQuota;
        }

        // Add to muse's plugin list
        if (!_isPluginInList(_museId, _pluginId)) {
            _musePluginList[_museId].push(_pluginId);
        }
    }

    function _handleSubscriptionInstall(
        uint256 _museId,
        uint256 _pluginId,
        uint256 _listingId,
        PluginListing memory listing,
        Installation storage installation
    ) internal {
        if (!installation.active || block.timestamp >= installation.expiresAt) {
            // New installation or expired
            _createInstallation(_museId, _pluginId, _listingId, listing);
        } else {
            // Extend existing subscription
            installation.expiresAt += listing.duration;
        }
        installation.trialEndsAt = 0; // Clear trial
    }

    function _handleUsageBasedInstall(
        uint256 _museId,
        uint256 _pluginId,
        uint256 _listingId,
        PluginListing memory listing,
        Installation storage installation
    ) internal {
        if (!installation.active) {
            _createInstallation(_museId, _pluginId, _listingId, listing);
        } else {
            // Add to existing quota
            installation.remainingQuota += listing.usageQuota;
        }
        installation.trialEndsAt = 0; // Clear trial
    }

    function _processPayment(uint256 _pluginId, uint256 _amount) internal {
        uint256 platformCut = (_amount * platformFee) / BASIS_POINTS;
        uint256 creatorCut = _amount - platformCut;

        address creator = _plugins[_pluginId].creator;
        _creatorEarnings[creator] += creatorCut;
        _pluginEarnings[_pluginId] += creatorCut;

        // Platform fees stay in contract until withdrawn
    }

    function _isPluginInList(uint256 _museId, uint256 _pluginId) internal view returns (bool) {
        uint256[] memory plugins = _musePluginList[_museId];
        for (uint256 i = 0; i < plugins.length; i++) {
            if (plugins[i] == _pluginId) {
                return true;
            }
        }
        return false;
    }

    function _removeFromPluginList(uint256 _museId, uint256 _pluginId) internal {
        uint256[] storage plugins = _musePluginList[_museId];
        for (uint256 i = 0; i < plugins.length; i++) {
            if (plugins[i] == _pluginId) {
                plugins[i] = plugins[plugins.length - 1];
                plugins.pop();
                break;
            }
        }
    }

    function _isCompanionForToken(uint256 _museId, address _caller) internal view returns (bool) {
        if (companionFactory == address(0)) {
            return false;
        }

        // Check if the caller is the companion contract for this token
        // Call the factory's getCompanion function
        (bool success, bytes memory data) = companionFactory.staticcall(
            abi.encodeWithSignature("getCompanion(uint256)", _museId)
        );

        if (!success || data.length == 0) {
            return false;
        }

        address companion = abi.decode(data, (address));
        return companion != address(0) && companion == _caller;
    }
}
