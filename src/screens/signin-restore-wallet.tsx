import React, {useCallback} from 'react';

import {ProviderMnemonicReactNative} from '@haqq/provider-mnemonic-react-native';
import {utils} from 'ethers';

import {SignInRestore} from '@app/components/singin-restore-wallet';
import {app} from '@app/contexts';
import {useTypedNavigation} from '@app/hooks';
import {makeID} from '@app/utils';

export const SignInRestoreScreen = () => {
  const navigation = useTypedNavigation();

  const onDoneTry = useCallback(
    async (seed: string) => {
      const nextScreen = app.onboarded
        ? 'signinStoreWallet'
        : 'onboardingSetupPin';

      if (
        utils.isHexString(seed.trim()) ||
        utils.isHexString(`0x${seed}`.trim())
      ) {
        const pk = seed.trim();

        navigation.push(nextScreen, {
          type: 'privateKey',
          privateKey: pk.startsWith('0x') ? pk : `0x${pk}`,
        });

        return;
      }

      if (utils.isValidMnemonic(seed.trim().toLowerCase())) {
        const generatedPassword = String(makeID(10));
        const passwordPromise = () => Promise.resolve(generatedPassword);

        const provider = await ProviderMnemonicReactNative.initialize(
          seed.trim().toLowerCase(),
          passwordPromise,
          {},
        );

        navigation.push('chooseAccount', {
          provider,
          type: 'mnemonic',
          mnemonic: seed.trim().toLowerCase(),
        });

        return;
      }

      throw new Error('unknown key');
    },
    [navigation],
  );

  return <SignInRestore onDoneTry={onDoneTry} testID="signin_restore" />;
};
