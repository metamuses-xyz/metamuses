// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IDATMarketplace {
    function hasAccess(address buyer, uint256 fileId) external view returns (bool);
    function recordInferenceUsage(address buyer, uint256 fileId) external;
}

/**
 * @title AccessControl
 * @dev Manages access verification for inference requests
 */
contract AccessControl is Ownable {
    IDATMarketplace public marketplace;

    // Mapping to track authorized inference nodes
    mapping(address => bool) public authorizedNodes;

    // Mapping to track inference requests
    mapping(bytes32 => InferenceRequest) public inferenceRequests;

    struct InferenceRequest {
        address requester;
        uint256 fileId;
        uint256 timestamp;
        bool completed;
        string resultHash; // IPFS hash of result
    }

    // Events
    event InferenceRequested(
        bytes32 indexed requestId,
        address indexed requester,
        uint256 indexed fileId
    );

    event InferenceCompleted(
        bytes32 indexed requestId,
        string resultHash
    );

    event NodeAuthorized(address indexed node, bool status);

    constructor(address _marketplace) Ownable(msg.sender) {
        require(_marketplace != address(0), "Invalid marketplace address");
        marketplace = IDATMarketplace(_marketplace);
    }

    /**
     * @dev Authorize or deauthorize an inference node
     */
    function setNodeAuthorization(address _node, bool _status) external onlyOwner {
        authorizedNodes[_node] = _status;
        emit NodeAuthorized(_node, _status);
    }

    /**
     * @dev Verify if a user has access to a file
     */
    function verifyAccess(address _user, uint256 _fileId) external view returns (bool) {
        return marketplace.hasAccess(_user, _fileId);
    }

    /**
     * @dev Request inference on a file
     */
    function requestInference(uint256 _fileId) external returns (bytes32) {
        require(marketplace.hasAccess(msg.sender, _fileId), "No access to this file");

        bytes32 requestId = keccak256(
            abi.encodePacked(msg.sender, _fileId, block.timestamp, block.number)
        );

        inferenceRequests[requestId] = InferenceRequest({
            requester: msg.sender,
            fileId: _fileId,
            timestamp: block.timestamp,
            completed: false,
            resultHash: ""
        });

        // Record usage in marketplace
        marketplace.recordInferenceUsage(msg.sender, _fileId);

        emit InferenceRequested(requestId, msg.sender, _fileId);

        return requestId;
    }

    /**
     * @dev Complete an inference request (called by authorized nodes)
     */
    function completeInference(bytes32 _requestId, string memory _resultHash) external {
        require(authorizedNodes[msg.sender], "Not an authorized node");

        InferenceRequest storage request = inferenceRequests[_requestId];
        require(!request.completed, "Already completed");
        require(request.requester != address(0), "Request does not exist");

        request.completed = true;
        request.resultHash = _resultHash;

        emit InferenceCompleted(_requestId, _resultHash);
    }

    /**
     * @dev Get inference request details
     */
    function getInferenceRequest(bytes32 _requestId)
        external
        view
        returns (InferenceRequest memory)
    {
        return inferenceRequests[_requestId];
    }

    /**
     * @dev Update marketplace address
     */
    function updateMarketplace(address _marketplace) external onlyOwner {
        require(_marketplace != address(0), "Invalid address");
        marketplace = IDATMarketplace(_marketplace);
    }
}
