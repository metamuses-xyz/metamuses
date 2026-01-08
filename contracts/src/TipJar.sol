// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TipJar
 * @notice Revenue-sharing tip contract for MetaMuses AI companions
 * @dev Accepts tips for any MuseAI NFT and splits 90% to creator, 10% to platform
 *      Works with both companions and direct NFT tips
 */
contract TipJar is ReentrancyGuard, Ownable {
    // ============ Constants ============

    /// @notice Creator receives 90% of tips
    uint256 public constant CREATOR_SHARE_BPS = 9000; // 90% in basis points

    /// @notice Platform receives 10% of tips
    uint256 public constant PLATFORM_SHARE_BPS = 1000; // 10% in basis points

    /// @notice Basis points denominator
    uint256 public constant BPS_DENOMINATOR = 10000;

    // ============ State Variables ============

    /// @notice The MuseAI NFT contract
    IERC721 public museAI;

    /// @notice Platform wallet that receives platform fees
    address public platformWallet;

    /// @notice Total tips received per token ID
    mapping(uint256 => uint256) public totalTipsPerToken;

    /// @notice Creator earnings available for withdrawal (by address)
    mapping(address => uint256) public creatorEarnings;

    /// @notice Total withdrawn by each creator
    mapping(address => uint256) public creatorWithdrawn;

    /// @notice Platform fees accumulated
    uint256 public platformFeesAccumulated;

    /// @notice Platform fees already withdrawn
    uint256 public platformFeesWithdrawn;

    /// @notice Total tips ever received by the contract
    uint256 public totalTipsReceived;

    // ============ Events ============

    event TipReceived(
        uint256 indexed tokenId,
        address indexed tipper,
        address indexed creator,
        uint256 totalAmount,
        uint256 creatorAmount,
        uint256 platformAmount,
        string message
    );

    event CreatorWithdrawal(
        address indexed creator,
        uint256 amount
    );

    event PlatformWithdrawal(
        address indexed platformWallet,
        uint256 amount
    );

    event PlatformWalletUpdated(
        address indexed oldWallet,
        address indexed newWallet
    );

    event MuseAIUpdated(
        address indexed oldMuseAI,
        address indexed newMuseAI
    );

    // ============ Constructor ============

    /**
     * @notice Initialize the TipJar with contract references
     * @param _museAI The MuseAI NFT contract address
     * @param _platformWallet The wallet to receive platform fees
     */
    constructor(address _museAI, address _platformWallet) {
        require(_museAI != address(0), "Invalid MuseAI address");
        require(_platformWallet != address(0), "Invalid platform wallet");

        museAI = IERC721(_museAI);
        platformWallet = _platformWallet;
    }

    // ============ Core Functions ============

    /**
     * @notice Send a tip to the owner of a MuseAI NFT
     * @dev Splits the tip 90/10 between creator and platform
     * @param tokenId The MuseAI token ID to tip
     * @param message Optional message to include with the tip
     */
    function tip(uint256 tokenId, string calldata message) external payable nonReentrant {
        require(msg.value > 0, "Tip must be greater than 0");

        // Get the current owner of the NFT (the creator who receives tips)
        address creator = museAI.ownerOf(tokenId);
        require(creator != address(0), "Invalid token");

        // Calculate splits
        uint256 creatorAmount = (msg.value * CREATOR_SHARE_BPS) / BPS_DENOMINATOR;
        uint256 platformAmount = msg.value - creatorAmount; // Remaining goes to platform

        // Update state
        totalTipsPerToken[tokenId] += msg.value;
        creatorEarnings[creator] += creatorAmount;
        platformFeesAccumulated += platformAmount;
        totalTipsReceived += msg.value;

        emit TipReceived(
            tokenId,
            msg.sender,
            creator,
            msg.value,
            creatorAmount,
            platformAmount,
            message
        );
    }

    /**
     * @notice Send a tip without a message
     * @param tokenId The MuseAI token ID to tip
     */
    function tip(uint256 tokenId) external payable nonReentrant {
        require(msg.value > 0, "Tip must be greater than 0");

        address creator = museAI.ownerOf(tokenId);
        require(creator != address(0), "Invalid token");

        uint256 creatorAmount = (msg.value * CREATOR_SHARE_BPS) / BPS_DENOMINATOR;
        uint256 platformAmount = msg.value - creatorAmount;

        totalTipsPerToken[tokenId] += msg.value;
        creatorEarnings[creator] += creatorAmount;
        platformFeesAccumulated += platformAmount;
        totalTipsReceived += msg.value;

        emit TipReceived(
            tokenId,
            msg.sender,
            creator,
            msg.value,
            creatorAmount,
            platformAmount,
            ""
        );
    }

    // ============ Withdrawal Functions ============

    /**
     * @notice Withdraw accumulated creator earnings
     * @dev Transfers all pending earnings to the caller
     */
    function withdrawCreatorEarnings() external nonReentrant {
        uint256 amount = creatorEarnings[msg.sender];
        require(amount > 0, "No earnings to withdraw");

        // Update state before transfer (CEI pattern)
        creatorEarnings[msg.sender] = 0;
        creatorWithdrawn[msg.sender] += amount;

        // Transfer funds
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");

        emit CreatorWithdrawal(msg.sender, amount);
    }

    /**
     * @notice Withdraw accumulated platform fees
     * @dev Only callable by platform wallet or owner
     */
    function withdrawPlatformFees() external nonReentrant {
        require(
            msg.sender == platformWallet || msg.sender == owner(),
            "Not authorized"
        );

        uint256 amount = platformFeesAccumulated - platformFeesWithdrawn;
        require(amount > 0, "No fees to withdraw");

        // Update state before transfer
        platformFeesWithdrawn += amount;

        // Transfer to platform wallet
        (bool success, ) = payable(platformWallet).call{value: amount}("");
        require(success, "Transfer failed");

        emit PlatformWithdrawal(platformWallet, amount);
    }

    // ============ View Functions ============

    /**
     * @notice Get pending earnings for a creator
     * @param creator The creator address
     * @return The amount available for withdrawal
     */
    function getPendingEarnings(address creator) external view returns (uint256) {
        return creatorEarnings[creator];
    }

    /**
     * @notice Get total tips received by a specific token
     * @param tokenId The MuseAI token ID
     * @return Total tips received
     */
    function getTipsForToken(uint256 tokenId) external view returns (uint256) {
        return totalTipsPerToken[tokenId];
    }

    /**
     * @notice Get pending platform fees
     * @return Amount available for platform withdrawal
     */
    function getPendingPlatformFees() external view returns (uint256) {
        return platformFeesAccumulated - platformFeesWithdrawn;
    }

    /**
     * @notice Get creator statistics
     * @param creator The creator address
     * @return pending Pending earnings
     * @return withdrawn Total withdrawn
     * @return total Total earned (pending + withdrawn)
     */
    function getCreatorStats(address creator) external view returns (
        uint256 pending,
        uint256 withdrawn,
        uint256 total
    ) {
        pending = creatorEarnings[creator];
        withdrawn = creatorWithdrawn[creator];
        total = pending + withdrawn;
    }

    /**
     * @notice Get comprehensive tip statistics
     * @return _totalTips Total tips ever received
     * @return _platformFeesPending Pending platform fees
     * @return _platformFeesWithdrawn Platform fees already withdrawn
     */
    function getStats() external view returns (
        uint256 _totalTips,
        uint256 _platformFeesPending,
        uint256 _platformFeesWithdrawn
    ) {
        _totalTips = totalTipsReceived;
        _platformFeesPending = platformFeesAccumulated - platformFeesWithdrawn;
        _platformFeesWithdrawn = platformFeesWithdrawn;
    }

    // ============ Admin Functions ============

    /**
     * @notice Update the platform wallet address
     * @param _newPlatformWallet The new platform wallet
     */
    function setPlatformWallet(address _newPlatformWallet) external onlyOwner {
        require(_newPlatformWallet != address(0), "Invalid address");

        address oldWallet = platformWallet;
        platformWallet = _newPlatformWallet;

        emit PlatformWalletUpdated(oldWallet, _newPlatformWallet);
    }

    /**
     * @notice Update the MuseAI contract reference
     * @dev Use with extreme caution
     * @param _newMuseAI The new MuseAI contract address
     */
    function setMuseAI(address _newMuseAI) external onlyOwner {
        require(_newMuseAI != address(0), "Invalid address");

        address oldMuseAI = address(museAI);
        museAI = IERC721(_newMuseAI);

        emit MuseAIUpdated(oldMuseAI, _newMuseAI);
    }

    // ============ Emergency Functions ============

    /**
     * @notice Emergency withdraw in case of stuck funds
     * @dev Only owner can call, sends all ETH to owner
     *      Should only be used in emergencies
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Transfer failed");
    }

    // ============ Receive ============

    /**
     * @notice Reject direct ETH transfers (must use tip function)
     */
    receive() external payable {
        revert("Use tip() function");
    }
}
