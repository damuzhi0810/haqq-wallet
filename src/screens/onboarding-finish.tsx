import React, {useCallback, useEffect, useMemo} from 'react';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {RootStackParamList} from '../types';
import {useApp} from '../contexts/app';
import {useWallets} from '../contexts/wallets';
import {Finish} from '../components/finish';

export const OnboardingFinishScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'createFinish'>>();
  const app = useApp();
  const wallets = useWallets();
  const title = useMemo(
    () =>
      route.params.action === 'create'
        ? 'Congratulations! You have successfully added a new wallet'
        : 'Congratulations! You have successfully recovered a wallet',
    [route.params.action],
  );

  const onEnd = useCallback(() => {
    if (app.getUser().onboarded) {
      navigation.getParent()?.goBack();
    } else {
      app.getUser().onboarded = true;
      navigation.replace('home');
    }
    requestAnimationFrame(async () => {
      await wallets.checkForBackup(app.snoozeBackup);
    });
  }, [app, navigation, wallets]);

  useEffect(() => {
    app.emit('modal', null);
  }, [app]);

  return <Finish title={title} onFinish={onEnd} testID="onboarding_finish" />;
};
