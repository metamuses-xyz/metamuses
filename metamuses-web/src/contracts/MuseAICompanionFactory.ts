import { Address } from "viem";

// MuseAI Companion Factory Contract - Deployed on Metis Hyperion Testnet
// Contract: 0x0195F6e8F1e37816c557c71AA36b46333E6d2E7A
// Explorer: https://explorer.hyperion-testnet.metis.io/address/0x0195F6e8F1e37816c557c71AA36b46333E6d2E7A
// Deployed: December 18, 2025

export const COMPANION_FACTORY_ADDRESS: Address =
  (process.env.NEXT_PUBLIC_COMPANION_FACTORY_ADDRESS as Address) ||
  "0x0195F6e8F1e37816c557c71AA36b46333E6d2E7A";

// PersonalityTraits struct for TypeScript
export interface PersonalityTraits {
  creativity: number; // 0-100
  wisdom: number; // 0-100
  humor: number; // 0-100
  empathy: number; // 0-100
  logic: number; // 0-100
}

export const COMPANION_FACTORY_ABI = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_museAI",
        type: "address",
        internalType: "address",
      },
      {
        name: "_pluginMarketplace",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "MAX_TRAIT_VALUE",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "uint8",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "companions",
    inputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "deployCompanion",
    inputs: [
      {
        name: "_tokenId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_traits",
        type: "tuple",
        internalType: "struct IMuseAICompanion.PersonalityTraits",
        components: [
          {
            name: "creativity",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "wisdom",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "humor",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "empathy",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "logic",
            type: "uint8",
            internalType: "uint8",
          },
        ],
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deployCompanionWithName",
    inputs: [
      {
        name: "_tokenId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_traits",
        type: "tuple",
        internalType: "struct IMuseAICompanion.PersonalityTraits",
        components: [
          {
            name: "creativity",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "wisdom",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "humor",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "empathy",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "logic",
            type: "uint8",
            internalType: "uint8",
          },
        ],
      },
      {
        name: "_name",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getCompanion",
    inputs: [
      {
        name: "_tokenId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCompanionByIndex",
    inputs: [
      {
        name: "_index",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCompanionInfo",
    inputs: [
      {
        name: "_tokenId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "exists",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "companionAddress",
        type: "address",
        internalType: "address",
      },
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
      {
        name: "personality",
        type: "tuple",
        internalType: "struct IMuseAICompanion.PersonalityTraits",
        components: [
          {
            name: "creativity",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "wisdom",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "humor",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "empathy",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "logic",
            type: "uint8",
            internalType: "uint8",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCompanionsByOwner",
    inputs: [
      {
        name: "_owner",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address[]",
        internalType: "address[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getOwnedTokensWithCompanions",
    inputs: [
      {
        name: "_owner",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "tokenIds",
        type: "uint256[]",
        internalType: "uint256[]",
      },
      {
        name: "companionAddresses",
        type: "address[]",
        internalType: "address[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasCompanion",
    inputs: [
      {
        name: "_tokenId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "museAI",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "pluginMarketplace",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalCompanions",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "CompanionCreated",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "owner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "companionContract",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "traits",
        type: "tuple",
        indexed: false,
        internalType: "struct IMuseAICompanion.PersonalityTraits",
        components: [
          {
            name: "creativity",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "wisdom",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "humor",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "empathy",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "logic",
            type: "uint8",
            internalType: "uint8",
          },
        ],
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "CompanionDeactivated",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "previousOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
] as const;
