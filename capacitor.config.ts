import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // Development identity: agree on the permanent package before the first Play release.
  appId: "com.frisbeeprep.app",
  appName: "Trainleaf",
  webDir: "dist-mobile",
  backgroundColor: "#f7f8f2",
  loggingBehavior: "debug",
  server: {
    // Local, bundled assets only. Do not add a hosted `url` here.
    androidScheme: "https",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    CapacitorSQLite: {
      // The first local prototype uses the Android application sandbox.
      // Encryption needs an explicit key lifecycle and recovery design first.
      androidIsEncryption: false,
      androidBiometric: { biometricAuth: false },
      iosIsEncryption: false,
      iosBiometric: { biometricAuth: false },
    },
    SystemBars: {
      insetsHandling: "css",
      initialViewportFitValueHint: "cover",
    },
  },
};

export default config;
