import { BN } from '../bigNumber'
import { getSecsSince, getVaultWeights, minusFeeBurn } from './nonContract'
import { addLiq } from './router'
import { calcShare, calcSwapOutput } from './utils'

export const one = BN(1).times(10).pow(18)

/**
 * Calculate LP tokens minted from a new bond deposit
 * @param inputToken @param pool @param feeOnTsf
 * @returns [unitsLP, bondedSparta, slipRevert, capRevert]
 */
export const bondLiq = (inputToken, pool, feeOnTsf) => {
  const _bondToken = BN(inputToken) // TOKEN received by DAO
  const _bondSparta = BN(calcSwapOutput(_bondToken, pool, true)) // SPARTA bonded in
  const _spartaRec = minusFeeBurn(_bondSparta) // SPARTA received by ROUTER (feeBurn)
  const [unitsLP, slipR, capR] = addLiq(inputToken, pool, feeOnTsf, _spartaRec) // LP units received by BondVault
  return [unitsLP, _bondSparta, slipR, capR]
}

/**
 * Calculate the user's current total claimable incentive
 * @param reserveBal @param daoClaim @param memberWeight @param totalWeight
 * @returns claimAmount
 */
export const calcReward = (reserveBal, daoClaim, memberWeight, totalWeight) => {
  const _reserve = BN(reserveBal) // Aim to deplete reserve over a number of days
  const daoReward = _reserve.times(daoClaim).div(10000) // Get the DAO's share of that
  return calcShare(memberWeight, totalWeight, daoReward) // Get users's share of that (1 era worth)
}

/**
 * Calculate the user's current incentive-claim per era
 * @param pools @param bond @param dao @param secsPerEra @param reserveBal
 * @returns claimAmount
 */
export const calcCurrentReward = (pools, bond, dao, secsPerEra, reserveBal) => {
  const _memberW = getVaultWeights(pools, dao.daoDetails, bond.bondDetails)
  const _totalW = BN(bond.totalWeight).plus(dao.totalWeight)
  const _secsSinceClaim = getSecsSince(dao.member.lastHarvest)
  const share = calcReward(reserveBal, dao.global.daoClaim, _memberW, _totalW)
  const reward = share.times(_secsSinceClaim).div(secsPerEra)
  return reward
}

/**
 * Check if proposal has quorum
 * @param bondWeight @param daoWeight @param proposalWeight
 * @returns
 */
export const hasQuorum = (bondWeight, daoWeight, proposalWeight) => {
  const _totalWeight = BN(bondWeight).plus(daoWeight) // Get combined total DAO weight
  const consensus = BN(_totalWeight).div(2) // Quorum > 50%
  const quorum = BN(proposalWeight).isGreaterThan(consensus)
  return quorum
}

/**
 * Check if proposal has quorum
 * @param bondWeight @param daoWeight @param proposalWeight
 * @returns
 */
export const hasMajority = (bondWeight, daoWeight, proposalWeight) => {
  const _totalWeight = BN(bondWeight).plus(daoWeight) // Get combined total DAO weight
  const consensus = BN(_totalWeight).times(6666).div(10000) // Majority > 66.6%
  const quorum = BN(proposalWeight).isGreaterThan(consensus)
  return quorum
}
