import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import Badge from 'react-bootstrap/Badge'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import { useWeb3React } from '@web3-react/core'
import { usePool } from '../../../store/pool'
import { useWeb3, watchAsset } from '../../../store/web3'
import { BN, convertFromWei, formatFromWei } from '../../../utils/bigNumber'
import ShareLink from '../../Share/ShareLink'
import { Icon } from '../../Icons/index'
import { calcSpotValueInBase, getPool } from '../../../utils/math/utils'
import { tempChains } from '../../../utils/web3'
import HelmetLoading from '../../Spinner/index'
import { useApp } from '../../../store/app'

const Assets = () => {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const wallet = useWeb3React()

  const { addresses } = useApp()
  const pool = usePool()
  const web3 = useWeb3()

  const getWalletType = () => {
    if (window.localStorage.getItem('lastWallet') === 'MM') {
      return 'MM'
    }
    if (window.localStorage.getItem('lastWallet') === 'TW') {
      return 'TW'
    }
    return false
  }

  const isBNB = (asset) => {
    if (asset.address === addresses.bnb) return true
    return false
  }

  const handleWatchAsset = (asset) => {
    const walletType = getWalletType()
    if (walletType === 'MM' && !isBNB(asset)) {
      dispatch(
        watchAsset(
          asset.address,
          asset.symbol,
          '18',
          asset.symbolUrl,
          wallet.account,
        ),
      )
    }
  }

  /** @returns {object} poolDetails item */
  const _getPool = (tokenAddr) => {
    const _pool = getPool(tokenAddr, pool.poolDetails)
    if (_pool !== '') {
      return _pool
    }
    return false
  }

  /** @returns {boolean} isSparta */
  const isSparta = (tokenAddr) => {
    if (tokenAddr === addresses.spartav1 || tokenAddr === addresses.spartav2) {
      return true
    }
    return false
  }

  /** @returns BN(usdValue) */
  const getUSD = (tokenAddr, amount) => {
    if (pool.poolDetails.length > 1 && tempChains.includes(wallet.chainId)) {
      if (isSparta(tokenAddr)) {
        return BN(amount).times(web3.spartaPrice)
      }
      if (_getPool) {
        return calcSpotValueInBase(amount, _getPool(tokenAddr)).times(
          web3.spartaPrice,
        )
      }
    }
    return '0.00'
  }

  const getTotalValue = () => {
    let total = BN(0)
    const _array = pool.tokenDetails?.filter((asset) => asset.balance > 0)
    for (let i = 0; i < _array.length; i++) {
      total = total.plus(getUSD(_array[i].address, _array[i].balance))
    }

    if (!total.isZero()) {
      return (
        <div className="hide-i5">
          <hr />
          <Row key="total-assets" className="output-card">
            <Col xs="auto" className="pe-1">
              {' '}
              <img width="35px" alt="empty" className="invisible" />
            </Col>

            <Col className="align-items-center">
              <Row>
                <Col xs="auto" className="float-left">
                  <strong>{t('total')}</strong>
                </Col>
                <Col>
                  <div className="text-sm-label text-end">
                    {web3.spartaPrice > 0 ? `~$${formatFromWei(total, 0)}` : ''}
                  </div>
                </Col>
              </Row>
            </Col>

            <Col
              className="text-center me-1 mt-1"
              style={{ maxWidth: '75px' }}
            />
          </Row>
        </div>
      )
    }
    return ''
  }

  const isLoading = () => {
    if (!pool.poolDetails && tempChains.includes(wallet.chainId)) {
      return true
    }
    return false
  }

  return (
    <>
      {!isLoading() ? (
        <>
          <Badge bg="secondary" className="mb-3">
            {t('heldInWallet')}
          </Badge>
          {pool.tokenDetails
            ?.filter((asset) => asset.balance > 0)
            .sort(
              (a, b) =>
                convertFromWei(getUSD(b.address, b.balance)) -
                convertFromWei(getUSD(a.address, a.balance)),
            )
            .map((asset) => (
              <Row key={`${asset.address}-asset`} className="mb-3 output-card">
                <Col xs="auto" className="pe-1">
                  <img
                    height="35px"
                    src={asset.symbolUrl}
                    alt={asset.name}
                    className="rounded-circle"
                  />
                </Col>

                <Col className="align-items-center">
                  <Row>
                    <Col xs="auto" className="float-left">
                      <strong>{asset.symbol}</strong>
                      <div className="text-sm-label">
                        {formatFromWei(asset.balance)}
                      </div>
                    </Col>
                    <Col className="hide-i5">
                      <div className="text-sm-label text-end mt-2">
                        {web3.spartaPrice > 0
                          ? `~$${formatFromWei(
                              getUSD(asset.address, asset.balance),
                              0,
                            )}`
                          : ''}
                      </div>
                    </Col>
                  </Row>
                </Col>

                <Col
                  className="text-center me-1 mt-1"
                  style={{ maxWidth: '75px' }}
                >
                  <Row>
                    <Col xs="6" className="p-0">
                      <ShareLink url={asset.address}>
                        <Icon icon="copy" size="16" />
                      </ShareLink>
                    </Col>
                    {getWalletType() && (
                      <Col xs="6" className="p-0">
                        <a
                          href={
                            getWalletType() === 'TW'
                              ? `trust://add_asset?asset=c20000714_t${asset.address}`
                              : '#section'
                          }
                        >
                          <div
                            role="button"
                            aria-hidden="true"
                            onClick={() => {
                              handleWatchAsset(asset)
                            }}
                          >
                            {!isBNB(asset) && (
                              <>
                                {getWalletType() === 'MM' ? (
                                  <Icon icon="metamask" size="22" />
                                ) : (
                                  getWalletType() === 'TW' && (
                                    <Icon icon="trustwallet" size="22" />
                                  )
                                )}
                              </>
                            )}
                          </div>
                        </a>
                      </Col>
                    )}
                  </Row>
                </Col>
              </Row>
            ))}
          {!isLoading() && getTotalValue()}
        </>
      ) : (
        <Col>
          <HelmetLoading height={100} width={100} />
        </Col>
      )}
    </>
  )
}

export default Assets
