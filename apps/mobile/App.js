import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Switch,
  Alert,
  Linking
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from './src/config';
import {
  startSpotifyAuth as startSpotifyAuthRequest,
  runAnalysis as runAnalysisRequest,
  createDonationCheckout,
  processSpotifyCallbackUrl,
  exchangeSpotifyCode
} from './src/api';

const SCREENS = {
  WELCOME: 'WELCOME',
  CONNECT: 'CONNECT',
  CONSENT: 'CONSENT',
  ANALYSIS_LOADING: 'ANALYSIS_LOADING',
  MODE_PICKER: 'MODE_PICKER',
  RETUNE_RESULTS: 'RETUNE_RESULTS',
  GREAT_LISTENER: 'GREAT_LISTENER',
  CHECKOUT: 'CHECKOUT',
  DONATION_HISTORY: 'DONATION_HISTORY'
};

const mockGreatListener = [
  { artistName: 'Beyoncé', charityName: 'BeyGOOD Foundation' },
  { artistName: 'Chance the Rapper', charityName: 'SocialWorks' },
  { artistName: 'Billie Eilish', charityName: 'REVERB' }
];

function PrimaryButton({ label, onPress, disabled }) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

function Card({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function App() {
  const [screen, setScreen] = useState(SCREENS.WELCOME);
  const [agreed, setAgreed] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [donationUsd, setDonationUsd] = useState('5');
  const [roundUp, setRoundUp] = useState(true);
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [donationHistory, setDonationHistory] = useState([]);
  const [spotifyAuthInfo, setSpotifyAuthInfo] = useState(null);
  const [spotifyCallbackInfo, setSpotifyCallbackInfo] = useState(null);
  const [callbackUrlInput, setCallbackUrlInput] = useState('');
  const [spotifyCodeInput, setSpotifyCodeInput] = useState('');
  const [spotifyTokenInfo, setSpotifyTokenInfo] = useState(null);

  const top5 = useMemo(() => analysis?.topRiskyRecommendations || [], [analysis]);

  useEffect(() => {
    const sub = Linking.addEventListener('url', event => {
      handleSpotifyCallback(event.url);
    });

    return () => {
      sub.remove();
    };
  }, []);

  async function handleSpotifyCallback(url) {
    try {
      const payload = await processSpotifyCallbackUrl(url);
      setSpotifyCallbackInfo(payload);
      Alert.alert('Spotify callback received', 'OAuth callback processed by API stub.');
    } catch (error) {
      Alert.alert('Spotify callback error', error.message || 'Could not process callback URL');
    }
  }

  async function startSpotifyAuth() {
    try {
      const payload = await startSpotifyAuthRequest();
      setSpotifyAuthInfo(payload);
      setScreen(SCREENS.CONSENT);
      await Linking.openURL(payload.authorizeUrl);
    } catch (error) {
      Alert.alert('Spotify connect error', error.message || 'Could not prepare Spotify connect');
    }
  }

  async function submitCallbackManually() {
    if (!callbackUrlInput.trim()) {
      Alert.alert('Callback URL required', 'Paste the callback URL first.');
      return;
    }

    await handleSpotifyCallback(callbackUrlInput.trim());
  }


  async function exchangeCodeManually() {
    if (!spotifyCodeInput.trim()) {
      Alert.alert('Spotify code required', 'Paste an authorization code first.');
      return;
    }

    try {
      const payload = await exchangeSpotifyCode(spotifyCodeInput.trim());
      setSpotifyTokenInfo(payload);
      Alert.alert('Token exchange complete', 'Received Spotify token metadata from API.');
    } catch (error) {
      Alert.alert('Token exchange failed', error.message || 'Could not exchange code.');
    }
  }

  async function runAnalysis() {
    setScreen(SCREENS.ANALYSIS_LOADING);
    setLoadingAnalysis(true);
    try {
      const payload = await runAnalysisRequest('demo-user');
      setAnalysis(payload);
      setDonationUsd(String(payload.overallSuggestedDonationUsd || 5));
      setScreen(SCREENS.MODE_PICKER);
    } catch (error) {
      Alert.alert('Analysis unavailable', error.message || 'Could not reach API.');
      setScreen(SCREENS.CONNECT);
    } finally {
      setLoadingAnalysis(false);
    }
  }

  async function createCheckout() {
    const amount = Number(donationUsd || 0);
    if (!Number.isFinite(amount) || amount < 5) {
      Alert.alert('Minimum donation', 'Donation must be at least $5.00');
      return;
    }

    try {
      const payload = await createDonationCheckout({
        amountUsd: amount,
        roundUpProcessingFees: roundUp
      });

      setCheckoutResult(payload);
      setDonationHistory(prev => [
        {
          id: `${Date.now()}`,
          amountUsd: payload.amountUsd,
          totalUsd: payload.totalUsd,
          createdAt: new Date().toISOString()
        },
        ...prev
      ]);
    } catch (error) {
      Alert.alert('Checkout unavailable', error.message || 'Could not connect to checkout endpoint.');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Play it Forward</Text>
        <Text style={styles.subtitle}>Internal Alpha v0.2</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {screen === SCREENS.WELCOME && (
          <Card title="Welcome">
            <Text style={styles.copy}>Keep the songs. Play it Forward.</Text>
            <Text style={styles.copy}>This alpha walks through the full TestFlight MVP user flow.</Text>
            <PrimaryButton label="Start" onPress={() => setScreen(SCREENS.CONNECT)} />
          </Card>
        )}

        {screen === SCREENS.CONNECT && (
          <Card title="Connect Spotify">
            <Text style={styles.copy}>Spotify OAuth handshake is wired to API stubs.</Text>
            <Text style={styles.copy}>API base: {API_BASE_URL}</Text>
            <PrimaryButton label="Connect Spotify" onPress={startSpotifyAuth} />
            {spotifyAuthInfo ? (
              <View style={styles.listItem}>
                <Text style={styles.listTitle}>Spotify auth prepared</Text>
                <Text style={styles.listBody}>State: {spotifyAuthInfo.state}</Text>
                <Text style={styles.listBody}>Redirect URI: {spotifyAuthInfo.redirectUri}</Text>
              </View>
            ) : null}

            <TextInput
              value={callbackUrlInput}
              onChangeText={setCallbackUrlInput}
              style={styles.input}
              placeholder="Paste callback URL (optional manual test)"
              placeholderTextColor="#9fb2ef"
            />
            <PrimaryButton label="Process callback URL" onPress={submitCallbackManually} />

            {spotifyCallbackInfo ? (
              <View style={styles.listItem}>
                <Text style={styles.listTitle}>Callback processed</Text>
                <Text style={styles.listBody}>Status: {spotifyCallbackInfo.status}</Text>
                <Text style={styles.listBody}>State: {spotifyCallbackInfo.state || 'none'}</Text>
              </View>
            ) : null}

            <TextInput
              value={spotifyCodeInput}
              onChangeText={setSpotifyCodeInput}
              style={styles.input}
              placeholder="Paste Spotify authorization code"
              placeholderTextColor="#9fb2ef"
            />
            <PrimaryButton label="Exchange code for token metadata" onPress={exchangeCodeManually} />

            {spotifyTokenInfo ? (
              <View style={styles.listItem}>
                <Text style={styles.listTitle}>Token exchange status</Text>
                <Text style={styles.listBody}>Type: {spotifyTokenInfo.tokenType}</Text>
                <Text style={styles.listBody}>Expires: {spotifyTokenInfo.expiresIn}s</Text>
                <Text style={styles.listBody}>Refresh token: {spotifyTokenInfo.hasRefreshToken ? 'yes' : 'no'}</Text>
              </View>
            ) : null}
          </Card>
        )}

        {screen === SCREENS.CONSENT && (
          <Card title="Consent">
            <Text style={styles.copy}>
              I agree to connect my Spotify listening history and use donation checkout rails.
            </Text>
            <View style={styles.inlineRow}>
              <Switch value={agreed} onValueChange={setAgreed} />
              <Text style={styles.copy}>I consent</Text>
            </View>
            <PrimaryButton label="Analyze Listening" disabled={!agreed} onPress={runAnalysis} />
          </Card>
        )}

        {screen === SCREENS.ANALYSIS_LOADING && (
          <Card title="Analyzing">
            {loadingAnalysis ? <ActivityIndicator color="#8a5bff" size="large" /> : null}
            <Text style={styles.copy}>Crunching your top artists and donation matches...</Text>
          </Card>
        )}

        {screen === SCREENS.MODE_PICKER && (
          <Card title="Choose your mode">
            <PrimaryButton label="ReTune (Dark Mode)" onPress={() => setScreen(SCREENS.RETUNE_RESULTS)} />
            <PrimaryButton label="Great Listener (Light Mode)" onPress={() => setScreen(SCREENS.GREAT_LISTENER)} />
            <PrimaryButton label="Donation history" onPress={() => setScreen(SCREENS.DONATION_HISTORY)} />
          </Card>
        )}

        {screen === SCREENS.RETUNE_RESULTS && (
          <Card title="ReTune results">
            <Text style={styles.copy}>Overall recommendation: ${analysis?.overallSuggestedDonationUsd || 5}</Text>
            {top5.map(item => (
              <View style={styles.listItem} key={`${item.rank}-${item.artistName}`}>
                <Text style={styles.listTitle}>{item.rank}. {item.artistName}</Text>
                <Text style={styles.listBody}>{item.charityName}</Text>
                <Text style={styles.listBody}>Suggested: ${item.suggestedDonationUsd}</Text>
              </View>
            ))}
            <PrimaryButton label="Continue to donate" onPress={() => setScreen(SCREENS.CHECKOUT)} />
            <PrimaryButton label="Back" onPress={() => setScreen(SCREENS.MODE_PICKER)} />
          </Card>
        )}

        {screen === SCREENS.GREAT_LISTENER && (
          <Card title="Great Listener">
            <Text style={styles.copy}>Join your favorites in support of these causes.</Text>
            {mockGreatListener.map(item => (
              <View style={styles.listItem} key={item.artistName}>
                <Text style={styles.listTitle}>{item.artistName}</Text>
                <Text style={styles.listBody}>{item.charityName}</Text>
              </View>
            ))}
            <PrimaryButton label="Back" onPress={() => setScreen(SCREENS.MODE_PICKER)} />
          </Card>
        )}

        {screen === SCREENS.CHECKOUT && (
          <Card title="Donate">
            <Text style={styles.copy}>Minimum donation is $5</Text>
            <TextInput
              value={donationUsd}
              onChangeText={setDonationUsd}
              keyboardType="decimal-pad"
              style={styles.input}
              placeholder="Donation amount"
              placeholderTextColor="#9fb2ef"
            />
            <View style={styles.inlineRow}>
              <Switch value={roundUp} onValueChange={setRoundUp} />
              <Text style={styles.copy}>Round up to cover fees (+7%)</Text>
            </View>
            <PrimaryButton label="Prepare checkout" onPress={createCheckout} />
            {checkoutResult && (
              <View style={styles.listItem}>
                <Text style={styles.listTitle}>Ready for provider checkout</Text>
                <Text style={styles.listBody}>Partner: {checkoutResult.partner}</Text>
                <Text style={styles.listBody}>Total: ${checkoutResult.totalUsd}</Text>
              </View>
            )}
            <PrimaryButton label="Back" onPress={() => setScreen(SCREENS.RETUNE_RESULTS)} />
          </Card>
        )}

        {screen === SCREENS.DONATION_HISTORY && (
          <Card title="Donation history">
            {donationHistory.length === 0 ? <Text style={styles.copy}>No donations yet.</Text> : null}
            {donationHistory.map(item => (
              <View key={item.id} style={styles.listItem}>
                <Text style={styles.listTitle}>${item.amountUsd} (total ${item.totalUsd})</Text>
                <Text style={styles.listBody}>{item.createdAt}</Text>
              </View>
            ))}
            <PrimaryButton label="Back" onPress={() => setScreen(SCREENS.MODE_PICKER)} />
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#090d1f'
  },
  header: {
    paddingTop: 12,
    paddingHorizontal: 20
  },
  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '700'
  },
  subtitle: {
    color: '#9fb2ef',
    marginTop: 2,
    marginBottom: 10
  },
  container: {
    padding: 16,
    paddingBottom: 40
  },
  card: {
    backgroundColor: '#121b3d',
    borderColor: '#24305f',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    gap: 12
  },
  cardTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700'
  },
  copy: {
    color: '#d8e3ff',
    fontSize: 15
  },
  button: {
    backgroundColor: '#6b6aff',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  buttonDisabled: {
    opacity: 0.5
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700'
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  listItem: {
    backgroundColor: '#0d1430',
    borderColor: '#22305f',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10
  },
  listTitle: {
    color: '#fff',
    fontWeight: '700',
    marginBottom: 2
  },
  listBody: {
    color: '#bdd0ff'
  },
  input: {
    borderColor: '#2d3d76',
    borderWidth: 1,
    borderRadius: 10,
    color: '#fff',
    padding: 10
  }
});
