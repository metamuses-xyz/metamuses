// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IMuseAICompanion} from "./IMuseAICompanion.sol";
import {IPluginMarketplace} from "../interfaces/IPluginMarketplace.sol";

/**
 * @title MuseAICompanion
 * @notice Individual AI Companion contract with personality traits and plugin management
 * @dev Deployed by MuseAICompanionFactory for each MuseAI NFT holder
 *      Ownership automatically follows the MuseAI NFT ownership
 */
contract MuseAICompanion is IMuseAICompanion, ReentrancyGuard {
    // ============ Constants ============

    uint8 public constant MAX_TRAIT_VALUE = 100;
    uint256 public constant MAX_NAME_LENGTH = 64;

    // ============ Immutables ============

    uint256 public immutable tokenId;
    address public immutable factory;
    address public immutable museAI;

    // ============ State Variables ============

    // Plugin marketplace reference (can be updated by factory)
    address public pluginMarketplace;

    // Personality
    PersonalityTraits private _personality;

    // Plugin tracking (local cache)
    mapping(uint256 => bool) private _installedPlugins;
    uint256[] private _pluginList;

    // Metadata
    uint256 public createdAt;
    string public name;

    // ============ Modifiers ============

    /**
     * @notice Restricts function to current NFT owner
     * @dev Reads ownership from MuseAI contract (auto-follow)
     */
    modifier onlyOwner() {
        require(msg.sender == owner(), "Not companion owner");
        _;
    }

    /**
     * @notice Restricts function to factory contract
     */
    modifier onlyFactory() {
        require(msg.sender == factory, "Not factory");
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Initialize the companion with personality traits
     * @param _tokenId The associated MuseAI NFT token ID
     * @param _museAI The MuseAI NFT contract address
     * @param _pluginMarketplace The plugin marketplace contract address
     * @param _traits Initial personality traits
     * @param _companionName Initial companion name
     */
    constructor(
        uint256 _tokenId,
        address _museAI,
        address _pluginMarketplace,
        PersonalityTraits memory _traits,
        string memory _companionName
    ) {
        require(_museAI != address(0), "Invalid MuseAI address");

        tokenId = _tokenId;
        factory = msg.sender;
        museAI = _museAI;
        pluginMarketplace = _pluginMarketplace;
        createdAt = block.timestamp;

        _validateTraits(_traits);
        _personality = _traits;

        if (bytes(_companionName).length > 0) {
            require(bytes(_companionName).length <= MAX_NAME_LENGTH, "Name too long");
            name = _companionName;
        }
    }

    // ============ Ownership (Auto-follow NFT) ============

    /**
     * @notice Get the current owner by reading from MuseAI NFT
     * @return The address of the current NFT owner
     */
    function owner() public view returns (address) {
        return IERC721(museAI).ownerOf(tokenId);
    }

    // ============ Personality Management ============

    /**
     * @notice Update the companion's personality traits
     * @param _newTraits The new personality traits (each 0-100)
     */
    function updatePersonality(PersonalityTraits calldata _newTraits) external onlyOwner {
        _validateTraits(_newTraits);

        PersonalityTraits memory oldTraits = _personality;
        _personality = _newTraits;

        emit PersonalityUpdated(oldTraits, _newTraits);
    }

    /**
     * @notice Get the current personality traits
     * @return The personality traits struct
     */
    function getPersonality() external view returns (PersonalityTraits memory) {
        return _personality;
    }

    /**
     * @notice Set a custom name for the companion
     * @param _name The new name (max 64 characters)
     */
    function setName(string calldata _name) external onlyOwner {
        require(bytes(_name).length <= MAX_NAME_LENGTH, "Name too long");

        string memory oldName = name;
        name = _name;

        emit NameUpdated(oldName, _name);
    }

    // ============ Plugin Management ============

    /**
     * @notice Install a plugin from the marketplace
     * @param _pluginId The plugin ID to install
     * @param _listingId The listing ID (pricing option)
     */
    function installPlugin(
        uint256 _pluginId,
        uint256 _listingId
    ) external payable nonReentrant onlyOwner {
        require(pluginMarketplace != address(0), "Marketplace not set");

        // Forward call to marketplace
        IPluginMarketplace(pluginMarketplace).installPlugin{value: msg.value}(
            tokenId,
            _pluginId,
            _listingId
        );

        // Track locally
        if (!_installedPlugins[_pluginId]) {
            _installedPlugins[_pluginId] = true;
            _pluginList.push(_pluginId);
        }

        emit PluginInstalled(_pluginId, _listingId);
    }

    /**
     * @notice Start a free trial for a plugin
     * @param _pluginId The plugin ID
     * @param _listingId The listing ID with trial enabled
     */
    function startTrial(
        uint256 _pluginId,
        uint256 _listingId
    ) external onlyOwner {
        require(pluginMarketplace != address(0), "Marketplace not set");

        IPluginMarketplace(pluginMarketplace).startTrial(
            tokenId,
            _pluginId,
            _listingId
        );

        // Track locally
        if (!_installedPlugins[_pluginId]) {
            _installedPlugins[_pluginId] = true;
            _pluginList.push(_pluginId);
        }

        emit TrialStarted(_pluginId, _listingId);
    }

    /**
     * @notice Uninstall a plugin (local tracking only)
     * @dev Does not interact with marketplace - just removes local tracking
     * @param _pluginId The plugin ID to uninstall
     */
    function uninstallPlugin(uint256 _pluginId) external onlyOwner {
        require(_installedPlugins[_pluginId], "Plugin not installed");

        _installedPlugins[_pluginId] = false;
        _removeFromPluginList(_pluginId);

        emit PluginUninstalled(_pluginId);
    }

    /**
     * @notice Check if a plugin is installed and has active access
     * @param _pluginId The plugin ID to check
     * @return True if the plugin has active access in marketplace
     */
    function hasPlugin(uint256 _pluginId) external view returns (bool) {
        if (pluginMarketplace == address(0)) {
            return false;
        }

        return IPluginMarketplace(pluginMarketplace).hasAccess(tokenId, _pluginId);
    }

    /**
     * @notice Get all locally tracked plugin IDs
     * @return Array of plugin IDs
     */
    function getInstalledPlugins() external view returns (uint256[] memory) {
        return _pluginList;
    }

    /**
     * @notice Renew a subscription-based plugin
     * @param _pluginId The plugin ID
     * @param _listingId The listing ID
     */
    function renewSubscription(
        uint256 _pluginId,
        uint256 _listingId
    ) external payable nonReentrant onlyOwner {
        require(pluginMarketplace != address(0), "Marketplace not set");

        IPluginMarketplace(pluginMarketplace).renewSubscription{value: msg.value}(
            tokenId,
            _pluginId,
            _listingId
        );

        emit SubscriptionRenewed(_pluginId, _listingId);
    }

    /**
     * @notice Purchase additional quota for usage-based plugin
     * @param _pluginId The plugin ID
     * @param _listingId The listing ID
     */
    function purchaseQuota(
        uint256 _pluginId,
        uint256 _listingId
    ) external payable nonReentrant onlyOwner {
        require(pluginMarketplace != address(0), "Marketplace not set");

        IPluginMarketplace(pluginMarketplace).purchaseQuota{value: msg.value}(
            tokenId,
            _pluginId,
            _listingId
        );

        emit QuotaPurchased(_pluginId, _listingId);
    }

    // ============ Utility ============

    /**
     * @notice Get comprehensive companion information
     * @return _tokenId The associated NFT token ID
     * @return _owner The current owner
     * @return _name The companion name
     * @return _personalityTraits The personality traits
     * @return _pluginCount Number of installed plugins
     * @return _createdAt Creation timestamp
     */
    function getInfo() external view returns (
        uint256 _tokenId,
        address _owner,
        string memory _name,
        PersonalityTraits memory _personalityTraits,
        uint256 _pluginCount,
        uint256 _createdAt
    ) {
        return (
            tokenId,
            owner(),
            name,
            _personality,
            _pluginList.length,
            createdAt
        );
    }

    /**
     * @notice Get count of active plugins (with marketplace access)
     * @return count Number of plugins with active access
     */
    function getActivePluginCount() external view returns (uint256 count) {
        if (pluginMarketplace == address(0)) {
            return 0;
        }

        IPluginMarketplace marketplace = IPluginMarketplace(pluginMarketplace);

        for (uint256 i = 0; i < _pluginList.length; i++) {
            if (marketplace.hasAccess(tokenId, _pluginList[i])) {
                count++;
            }
        }
    }

    // ============ Factory Functions ============

    /**
     * @notice Update the plugin marketplace address (factory only)
     * @param _newMarketplace The new marketplace address
     */
    function setPluginMarketplace(address _newMarketplace) external onlyFactory {
        pluginMarketplace = _newMarketplace;
    }

    // ============ Internal Functions ============

    /**
     * @notice Validate personality traits are within bounds
     * @param _traits The traits to validate
     */
    function _validateTraits(PersonalityTraits memory _traits) internal pure {
        require(_traits.creativity <= MAX_TRAIT_VALUE, "Creativity must be 0-100");
        require(_traits.wisdom <= MAX_TRAIT_VALUE, "Wisdom must be 0-100");
        require(_traits.humor <= MAX_TRAIT_VALUE, "Humor must be 0-100");
        require(_traits.empathy <= MAX_TRAIT_VALUE, "Empathy must be 0-100");
        require(_traits.logic <= MAX_TRAIT_VALUE, "Logic must be 0-100");
    }

    /**
     * @notice Remove a plugin ID from the local list
     * @param _pluginId The plugin ID to remove
     */
    function _removeFromPluginList(uint256 _pluginId) internal {
        for (uint256 i = 0; i < _pluginList.length; i++) {
            if (_pluginList[i] == _pluginId) {
                _pluginList[i] = _pluginList[_pluginList.length - 1];
                _pluginList.pop();
                break;
            }
        }
    }

    // ============ Receive ETH ============

    /**
     * @notice Allow contract to receive ETH (for refunds from marketplace)
     */
    receive() external payable {}

    /**
     * @notice Withdraw any ETH stuck in contract
     */
    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        payable(owner()).transfer(balance);
    }
}
