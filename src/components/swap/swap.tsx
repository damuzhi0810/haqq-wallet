import React, {useMemo} from 'react';

import {observer} from 'mobx-react';
import {View} from 'react-native';

import {Color} from '@app/colors';
import {createTheme} from '@app/helpers';
import {shortAddress} from '@app/helpers/short-address';
import {useSumAmount} from '@app/hooks';
import {I18N} from '@app/i18n';
import {Contracts} from '@app/models/contracts';
import {Provider} from '@app/models/provider';
import {Wallet} from '@app/models/wallet';
import {Balance} from '@app/services/balance';
import {
  SushiPoolEstimateResponse,
  SushiPoolResponse,
  SushiRoute,
} from '@app/services/indexer';
import {IToken} from '@app/types';
import {formatNumberString} from '@app/utils';
import {STRINGS} from '@app/variables/common';

import {EstimatedValue} from './estimated-value';
import {SwapInput} from './swap-input';
import {
  SwapRoutePathIcons,
  SwapRoutePathIconsType,
} from './swap-route-path-icons';
import {
  SwapSettingBottomSheet,
  SwapSettingBottomSheetRef,
  SwapTransactionSettings,
} from './swap-settings-bottom-sheet';

import {DismissPopupButton} from '../popup/dismiss-popup-button';
import {
  Button,
  ButtonVariant,
  First,
  Icon,
  IconButton,
  IconsName,
  KeyboardSafeArea,
  Spacer,
  Text,
  TextVariant,
} from '../ui';
import {WalletRow, WalletRowTypes} from '../wallet-row';

export type PoolsData = Omit<SushiPoolResponse, 'contracts'> & {
  contracts: IToken[];
};

export interface SwapProps {
  currentWallet: Wallet;
  poolData: PoolsData;
  estimateData: SushiPoolEstimateResponse | null;
  tokenIn: IToken;
  tokenOut: IToken;
  amountsIn: ReturnType<typeof useSumAmount>;
  amountsOut: ReturnType<typeof useSumAmount>;
  isEstimating: boolean;
  isSwapInProgress: boolean;
  isApproveInProgress: boolean;
  isWrapTx: boolean;
  isUnwrapTx: boolean;
  t0Current: Balance;
  t1Current: Balance;
  t0Available: Balance;
  t1Available: Balance;
  providerFee: Balance;
  minReceivedAmount: Balance;
  swapSettingsRef: React.RefObject<SwapSettingBottomSheetRef>;
  swapSettings: SwapTransactionSettings;
  currentRoute: SushiRoute;
  onSettingsChange: (settings: SwapTransactionSettings) => void;
  onPressWrap(): Promise<void>;
  onPressUnrap(): Promise<void>;
  onPressMax(): Promise<void>;
  onInputBlur(): Promise<void>;
  onPressChangeTokenIn(): Promise<void>;
  onPressChangeTokenOut(): Promise<void>;
  onPressSwap(): Promise<void>;
  onPressApprove(): Promise<void>;
  onPressChangeWallet(): void;
  onPressChangeDirection(): void;
  onPressSettings(): void;
}

export const Swap = observer(
  ({
    amountsIn,
    amountsOut,
    estimateData,
    isEstimating,
    tokenIn,
    tokenOut,
    isApproveInProgress,
    isSwapInProgress,
    isUnwrapTx,
    isWrapTx,
    t0Current,
    t1Current,
    t0Available,
    t1Available,
    currentWallet,
    providerFee,
    swapSettingsRef,
    swapSettings,
    minReceivedAmount,
    currentRoute,
    onSettingsChange,
    onPressWrap,
    onPressUnrap,
    onPressChangeTokenIn,
    onPressChangeTokenOut,
    onPressApprove,
    onPressChangeWallet,
    onPressSwap,
    onInputBlur,
    onPressMax,
    onPressChangeDirection,
    onPressSettings,
  }: SwapProps) => {
    const isHeaderButtonsDisabled =
      isEstimating || isSwapInProgress || isApproveInProgress;

    const isSwapButtonDisabled = useMemo(() => {
      return (
        isEstimating ||
        isSwapInProgress ||
        !!amountsIn.error ||
        !t0Current.isPositive()
      );
    }, [isEstimating, isSwapInProgress, amountsIn.error, t0Current]);

    const isApproveButtonDisabled = useMemo(() => {
      return (
        isApproveInProgress || !!amountsIn.error || !t0Current.isPositive()
      );
    }, [isApproveInProgress, amountsIn.error, t0Current]);

    const rate = useMemo(() => {
      const r =
        t1Current.toFloat() /
        new Balance(
          estimateData?.amount_in!,
          t0Current.getPrecission(),
          t0Current.getSymbol(),
        ).toFloat();
      return new Balance(r, 0, t1Current.getSymbol()).toBalanceString('auto');
    }, [t1Current, t0Current, estimateData]);

    const priceImpactColor = useMemo(() => {
      if (!estimateData?.s_price_impact) {
        return Color.textBase1;
      }

      const PI = parseFloat(estimateData.s_price_impact);

      if (PI >= 5) {
        return Color.textRed1;
      }

      if (PI >= 1) {
        return Color.textYellow1;
      }

      return Color.textBase1;
    }, [estimateData]);
    return (
      <KeyboardSafeArea style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerButtonsContainer}>
            <IconButton
              onPress={onPressChangeDirection}
              disabled={isHeaderButtonsDisabled}>
              <Icon
                i24
                name={IconsName.swap_vertical}
                color={Color.graphicGreen1}
              />
            </IconButton>
            <Spacer width={10} />
            <IconButton
              onPress={onPressSettings}
              disabled={isHeaderButtonsDisabled}>
              <Icon i24 name={IconsName.settings} color={Color.graphicGreen1} />
            </IconButton>
          </View>
          <Spacer flex={1} />
          <Text variant={TextVariant.t8} i18n={I18N.swapScreenTitle} />
          <Spacer flex={1} />
          <WalletRow
            item={currentWallet}
            type={WalletRowTypes.variant3}
            onPress={onPressChangeWallet}
          />
          <Spacer width={10} />
          <DismissPopupButton />
        </View>

        <Spacer height={12} />

        <SwapInput
          label={I18N.transactionDetailAmountIn}
          placeholder={I18N.transactionInfoFunctionValue}
          amounts={amountsIn}
          isLoading={isEstimating}
          currentBalance={t0Current}
          availableBalance={t0Available}
          token={tokenIn}
          disableTextFieldLoader={true}
          autoFocus={true}
          showMaxButton={true}
          onPressMax={onPressMax}
          onBlur={onInputBlur}
          onPressChangeToken={onPressChangeTokenIn}
        />

        <Spacer height={24} />

        <SwapInput
          label={I18N.transactionDetailAmountOut}
          placeholder={I18N.transactionInfoFunctionValue}
          amounts={amountsOut}
          editable={false}
          currentBalance={t1Current}
          availableBalance={t1Available}
          isLoading={isEstimating}
          token={tokenOut}
          onPressChangeToken={onPressChangeTokenOut}
        />

        <Spacer height={24} />

        {!!estimateData && (
          <View>
            <EstimatedValue
              title={I18N.swapScreenRate}
              value={`1${STRINGS.NBSP}${t0Current.getSymbol()}${STRINGS.NBSP}≈${
                STRINGS.NBSP
              }${rate}`}
            />
            {!isWrapTx && !isUnwrapTx && (
              <>
                <EstimatedValue
                  title={I18N.swapScreenProviderFee}
                  value={providerFee.toFiat({
                    useDefaultCurrency: true,
                    fixed: 6,
                  })}
                />
                <EstimatedValue
                  title={I18N.swapScreenPriceImpact}
                  valueColor={priceImpactColor}
                  value={`${formatNumberString(estimateData.s_price_impact)}%`}
                />
                <EstimatedValue
                  title={I18N.swapScreenMinimumReceived}
                  value={minReceivedAmount.toBalanceString('auto')}
                />
              </>
            )}

            <First>
              {(isWrapTx || isUnwrapTx) && (
                <EstimatedValue
                  title={I18N.swapScreenRoutingSource}
                  value={`${Contracts.getById(
                    Provider.selectedProvider.config.wethAddress,
                  )?.name}${STRINGS.NBSP}${shortAddress(
                    Provider.selectedProvider.config.wethAddress!,
                    '•',
                    true,
                  )}`}
                />
              )}
              <EstimatedValue
                title={I18N.swapScreenRoutingSource}
                value={'SwapRouterV3'}
              />
            </First>

            <EstimatedValue
              title={I18N.swapScreenRoute}
              value={
                <SwapRoutePathIcons
                  type={SwapRoutePathIconsType.route}
                  route={currentRoute.route}
                />
              }
            />
          </View>
        )}

        <Spacer />

        <First>
          {isUnwrapTx && (
            <Button
              variant={ButtonVariant.contained}
              i18n={I18N.swapScreenUnwrap}
              loading={isEstimating || isSwapInProgress}
              disabled={isSwapButtonDisabled}
              onPress={onPressUnrap}
            />
          )}
          {isWrapTx && (
            <Button
              variant={ButtonVariant.contained}
              i18n={I18N.swapScreenWrap}
              loading={isEstimating || isSwapInProgress}
              disabled={isSwapButtonDisabled}
              onPress={onPressWrap}
            />
          )}
          {!!estimateData?.need_approve && (
            <Button
              variant={ButtonVariant.contained}
              i18n={I18N.swapScreenApprove}
              i18params={{
                symbol: tokenIn.symbol || Provider.selectedProvider.denom,
                amount: amountsIn.amount,
              }}
              loading={isApproveInProgress}
              disabled={isApproveButtonDisabled}
              onPress={onPressApprove}
            />
          )}
          <Button
            variant={ButtonVariant.contained}
            i18n={I18N.swapScreenSwap}
            loading={isEstimating || isSwapInProgress}
            disabled={isSwapButtonDisabled}
            onPress={onPressSwap}
          />
        </First>

        <SwapSettingBottomSheet
          ref={swapSettingsRef}
          value={swapSettings}
          onSettingsChange={onSettingsChange}
        />
      </KeyboardSafeArea>
    );
  },
);

const styles = createTheme({
  container: {
    paddingHorizontal: 20,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    marginTop: 12,
  },
  headerButtonsContainer: {
    flexDirection: 'row',
  },
});
