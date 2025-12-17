// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IMuseAICompanion, IMuseAICompanionFactory} from "./IMuseAICompanion.sol";
import {MuseAICompanion} from "./MuseAICompanion.sol";

/**
 * @title MuseAICompanionFactory
 * @notice Factory contract for deploying individual AI Companion contracts
 * @dev Allows MuseAI NFT holders to deploy their own companion with personality traits
 *      Each NFT can only have one companion - ownership auto-follows the NFT
 */
contract MuseAICompanionFactory is IMuseAICompanionFactory, Ownable {
    // ============ Constants ============

    uint8 public constant MAX_TRAIT_VALUE = 100;

    // ============ State Variables ============

    /// @notice The MuseAI NFT contract address
    address public museAI;

    /// @notice The plugin marketplace contract address
    address public pluginMarketplace;

    /// @notice Mapping from token ID to companion contract address
    mapping(uint256 => address) public companions;

    /// @notice Total number of deployed companions
    uint256 public totalCompanions;

    /// @notice Array of all companion addresses for enumeration
    address[] private _allCompanions;

    // ============ Events ============

    event PluginMarketplaceUpdated(address indexed oldMarketplace, address indexed newMarketplace);
    event MuseAIUpdated(address indexed oldMuseAI, address indexed newMuseAI);

    // ============ Constructor ============

    /**
     * @notice Initialize the factory with contract references
     * @param _museAI The MuseAI NFT contract address
     * @param _pluginMarketplace The plugin marketplace address (can be zero)
     */
    constructor(address _museAI, address _pluginMarketplace) {
        require(_museAI != address(0), "Invalid MuseAI address");
        museAI = _museAI;
        pluginMarketplace = _pluginMarketplace;
    }

    // ============ Core Functions ============

    /**
     * @notice Deploy a new companion for a MuseAI NFT
     * @param _tokenId The MuseAI token ID to create a companion for
     * @param _traits Initial personality traits (each 0-100)
     * @return The deployed companion contract address
     */
    function deployCompanion(
        uint256 _tokenId,
        IMuseAICompanion.PersonalityTraits calldata _traits
    ) external returns (address) {
        // Verify caller owns the token
        require(IERC721(museAI).ownerOf(_tokenId) == msg.sender, "Not token owner");

        // Verify no companion exists for this token
        require(companions[_tokenId] == address(0), "Companion already exists");

        // Validate traits
        _validateTraits(_traits);

        // Deploy new companion contract
        MuseAICompanion companion = new MuseAICompanion(
            _tokenId,
            museAI,
            pluginMarketplace,
            _traits,
            ""  // No initial name
        );

        address companionAddress = address(companion);

        // Register companion
        companions[_tokenId] = companionAddress;
        _allCompanions.push(companionAddress);
        totalCompanions++;

        emit CompanionCreated(_tokenId, msg.sender, companionAddress, _traits);

        return companionAddress;
    }

    /**
     * @notice Deploy a new companion with a custom name
     * @param _tokenId The MuseAI token ID
     * @param _traits Initial personality traits
     * @param _name Initial companion name
     * @return The deployed companion contract address
     */
    function deployCompanionWithName(
        uint256 _tokenId,
        IMuseAICompanion.PersonalityTraits calldata _traits,
        string calldata _name
    ) external returns (address) {
        // Verify caller owns the token
        require(IERC721(museAI).ownerOf(_tokenId) == msg.sender, "Not token owner");

        // Verify no companion exists for this token
        require(companions[_tokenId] == address(0), "Companion already exists");

        // Validate traits
        _validateTraits(_traits);

        // Deploy new companion contract
        MuseAICompanion companion = new MuseAICompanion(
            _tokenId,
            museAI,
            pluginMarketplace,
            _traits,
            _name
        );

        address companionAddress = address(companion);

        // Register companion
        companions[_tokenId] = companionAddress;
        _allCompanions.push(companionAddress);
        totalCompanions++;

        emit CompanionCreated(_tokenId, msg.sender, companionAddress, _traits);

        return companionAddress;
    }

    // ============ View Functions ============

    /**
     * @notice Get the companion contract address for a token
     * @param _tokenId The MuseAI token ID
     * @return The companion contract address (zero if none)
     */
    function getCompanion(uint256 _tokenId) external view returns (address) {
        return companions[_tokenId];
    }

    /**
     * @notice Check if a token has a deployed companion
     * @param _tokenId The MuseAI token ID
     * @return True if companion exists
     */
    function hasCompanion(uint256 _tokenId) external view returns (bool) {
        return companions[_tokenId] != address(0);
    }

    /**
     * @notice Get all companions owned by an address
     * @dev Iterates through all companions to find those with matching owner
     *      This is a view function and can be gas-intensive for large numbers
     * @param _owner The owner address to query
     * @return Array of companion addresses owned by the address
     */
    function getCompanionsByOwner(address _owner) external view returns (address[] memory) {
        // First, count matching companions
        uint256 count = 0;
        for (uint256 i = 0; i < _allCompanions.length; i++) {
            if (IMuseAICompanion(_allCompanions[i]).owner() == _owner) {
                count++;
            }
        }

        // Create result array
        address[] memory result = new address[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < _allCompanions.length; i++) {
            if (IMuseAICompanion(_allCompanions[i]).owner() == _owner) {
                result[index] = _allCompanions[i];
                index++;
            }
        }

        return result;
    }

    /**
     * @notice Get companion address by index
     * @param _index The index in the companions array
     * @return The companion address at that index
     */
    function getCompanionByIndex(uint256 _index) external view returns (address) {
        require(_index < _allCompanions.length, "Index out of bounds");
        return _allCompanions[_index];
    }

    /**
     * @notice Get companion information for a token
     * @param _tokenId The MuseAI token ID
     * @return exists Whether a companion exists
     * @return companionAddress The companion contract address
     * @return owner The current owner (via NFT)
     * @return personality The personality traits
     */
    function getCompanionInfo(uint256 _tokenId) external view returns (
        bool exists,
        address companionAddress,
        address owner,
        IMuseAICompanion.PersonalityTraits memory personality
    ) {
        companionAddress = companions[_tokenId];
        exists = companionAddress != address(0);

        if (exists) {
            IMuseAICompanion companion = IMuseAICompanion(companionAddress);
            owner = companion.owner();
            personality = companion.getPersonality();
        }
    }

    /**
     * @notice Get tokens with companions for an owner using NFT enumeration
     * @dev Requires MuseAI to implement IERC721Enumerable
     * @param _owner The owner address
     * @return tokenIds Array of token IDs that have companions
     * @return companionAddresses Corresponding companion addresses
     */
    function getOwnedTokensWithCompanions(address _owner) external view returns (
        uint256[] memory tokenIds,
        address[] memory companionAddresses
    ) {
        // Try to use enumerable interface
        try IERC721Enumerable(museAI).balanceOf(_owner) returns (uint256 balance) {
            // Count tokens with companions
            uint256 count = 0;
            for (uint256 i = 0; i < balance; i++) {
                uint256 tokenId = IERC721Enumerable(museAI).tokenOfOwnerByIndex(_owner, i);
                if (companions[tokenId] != address(0)) {
                    count++;
                }
            }

            // Build result arrays
            tokenIds = new uint256[](count);
            companionAddresses = new address[](count);
            uint256 index = 0;

            for (uint256 i = 0; i < balance; i++) {
                uint256 tokenId = IERC721Enumerable(museAI).tokenOfOwnerByIndex(_owner, i);
                if (companions[tokenId] != address(0)) {
                    tokenIds[index] = tokenId;
                    companionAddresses[index] = companions[tokenId];
                    index++;
                }
            }
        } catch {
            // Return empty arrays if enumerable not supported
            tokenIds = new uint256[](0);
            companionAddresses = new address[](0);
        }
    }

    // ============ Admin Functions ============

    /**
     * @notice Update the plugin marketplace address
     * @dev Only owner can call. Does not update existing companions.
     * @param _newMarketplace The new marketplace address
     */
    function setPluginMarketplace(address _newMarketplace) external onlyOwner {
        address oldMarketplace = pluginMarketplace;
        pluginMarketplace = _newMarketplace;
        emit PluginMarketplaceUpdated(oldMarketplace, _newMarketplace);
    }

    /**
     * @notice Update plugin marketplace for a specific companion
     * @dev Only owner can call. Updates an existing companion's marketplace reference.
     * @param _tokenId The token ID of the companion to update
     * @param _newMarketplace The new marketplace address
     */
    function updateCompanionMarketplace(
        uint256 _tokenId,
        address _newMarketplace
    ) external onlyOwner {
        address companionAddress = companions[_tokenId];
        require(companionAddress != address(0), "Companion does not exist");

        MuseAICompanion(payable(companionAddress)).setPluginMarketplace(_newMarketplace);
    }

    /**
     * @notice Batch update marketplace for multiple companions
     * @dev Only owner can call. Gas-intensive for large arrays.
     * @param _tokenIds Array of token IDs to update
     * @param _newMarketplace The new marketplace address
     */
    function batchUpdateCompanionMarketplaces(
        uint256[] calldata _tokenIds,
        address _newMarketplace
    ) external onlyOwner {
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            address companionAddress = companions[_tokenIds[i]];
            if (companionAddress != address(0)) {
                MuseAICompanion(payable(companionAddress)).setPluginMarketplace(_newMarketplace);
            }
        }
    }

    /**
     * @notice Update the MuseAI NFT contract address
     * @dev Only owner can call. Use with extreme caution - affects ownership verification.
     * @param _newMuseAI The new MuseAI contract address
     */
    function setMuseAI(address _newMuseAI) external onlyOwner {
        require(_newMuseAI != address(0), "Invalid address");
        address oldMuseAI = museAI;
        museAI = _newMuseAI;
        emit MuseAIUpdated(oldMuseAI, _newMuseAI);
    }

    // ============ Internal Functions ============

    /**
     * @notice Validate personality traits are within bounds
     * @param _traits The traits to validate
     */
    function _validateTraits(IMuseAICompanion.PersonalityTraits calldata _traits) internal pure {
        require(_traits.creativity <= MAX_TRAIT_VALUE, "Creativity must be 0-100");
        require(_traits.wisdom <= MAX_TRAIT_VALUE, "Wisdom must be 0-100");
        require(_traits.humor <= MAX_TRAIT_VALUE, "Humor must be 0-100");
        require(_traits.empathy <= MAX_TRAIT_VALUE, "Empathy must be 0-100");
        require(_traits.logic <= MAX_TRAIT_VALUE, "Logic must be 0-100");
    }
}
