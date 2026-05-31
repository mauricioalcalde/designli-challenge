const fs = require('fs');
const path = 'C:/dev/dl/node_modules/.pnpm/expo-modules-core@2.2.3/node_modules/expo-modules-core/android/build.gradle';

let content = fs.readFileSync(path, 'utf8');

if (!content.includes('suppressKotlinVersionCompatibilityCheck')) {
  content = content.replace(
    'android {',
    'android {\n' +
    '    kotlinOptions {\n' +
    '        freeCompilerArgs += ["-P", "plugin:androidx.compose.compiler.plugins.kotlin:suppressKotlinVersionCompatibilityCheck=true"]\n' +
    '    }'
  );
  fs.writeFileSync(path, content);
  console.log('patched expo-modules-core');
} else {
  console.log('already patched');
}
