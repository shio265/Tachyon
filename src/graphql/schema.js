import {
    GraphQLObjectType,
    GraphQLSchema,
    GraphQLString,
    GraphQLID,
    GraphQLList,
    GraphQLInt,
    GraphQLNonNull
} from "graphql";

import { 
    getRewardById,
    getAllRewards 
} from "../database/queries/rewards.js";

import { 
    getRedeemCodeByCode, 
    getAllRedeemCodes 
} from "../database/queries/redeem_codes.js";

const RewardType = new GraphQLObjectType({
  name: "Reward",
  fields: {
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    icon: { type: GraphQLString }
  }
});

const RedeemCodeType = new GraphQLObjectType({
  name: "RedeemCode",
  fields: {
    id: { type: GraphQLID },
    uploader_id: { type: GraphQLID },
    code: { type: GraphQLString },
    expired_at: { type: GraphQLString },
    created_at: { type: GraphQLString },
    rewards: {
        type: new GraphQLList(new GraphQLObjectType({
            name: "RedeemCodeReward",
            fields: {
                reward_id: { type: GraphQLID },
                name: { type: GraphQLString },
                icon: { type: GraphQLString },
                amount: { type: GraphQLInt }
            }
        }))
    }
  }
});

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "Query",
    fields: {
      reward: {
        type: RewardType,
        args: {
          id: { type: new GraphQLNonNull(GraphQLID) }
        },
        resolve: (_, args) => {
          return getRewardById(args.id);
        }
        },
        rewards: {
        type: new GraphQLList(RewardType),
        resolve: () => {
          return getAllRewards();
        }
      },
      redeemCode: {
        type: RedeemCodeType,
        args: {
          code: { type: new GraphQLNonNull(GraphQLString) }
        },
        resolve: (_, args) => {
          return getRedeemCodeByCode(args.code);
        }
      },
      redeemCodes: {
        type: new GraphQLList(RedeemCodeType),
        resolve: () => {
          return getAllRedeemCodes();
        }
      }
    }
  })
});

export { schema };