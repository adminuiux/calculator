/**
 * Version Synchronization Script
 *
 * Keeps version numbers perfectly in sync across:
 *   1. package.json ("version": "x.y.z")
 *   2. src/*.js (JSDoc banner @version)
 *   3. README.md (CDN URLs & badge versions)
 *   4. Matching preview HTML in src/pages/plugin-preview/ (CDN URLs & copy buttons)
 *   5. dist/* bundles (via automatic execution of scripts/build.js)
 *
 * Usage:
 *   npm run version:sync                 # Syncs all files to match package.json version
 *   node scripts/sync-version.js 1.0.1   # Updates version to 1.0.1 across all files
 *   node scripts/sync-version.js patch   # Increments patch (e.g. 1.0.0 -> 1.0.1) and syncs
 *   node scripts/sync-version.js minor   # Increments minor (e.g. 1.0.0 -> 1.1.0) and syncs
 *   node scripts/sync-version.js major   # Increments major (e.g. 1.0.0 -> 2.0.0) and syncs
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pluginDir = path.resolve(__dirname, '..');
const pkgPath = path.join(pluginDir, 'package.json');
const srcDir = path.join(pluginDir, 'src');
const readmePath = path.join(pluginDir, 'README.md');
const previewsDir = path.resolve(pluginDir, '../../../../pages/plugin-preview');

if (!fs.existsSync(pkgPath)) {
    console.error('✖ Error: package.json not found in ' + pluginDir);
    process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const pkgName = pkg.name;
let currentVersion = pkg.version || '1.0.0';
let targetVersion = process.argv[2];

function bump(version, type) {
    const parts = (version || '1.0.0').split('.').map(n => parseInt(n, 10));
    while (parts.length < 3) parts.push(0);
    if (type === 'major') {
        parts[0] += 1;
        parts[1] = 0;
        parts[2] = 0;
    } else if (type === 'minor') {
        parts[1] += 1;
        parts[2] = 0;
    } else {
        parts[2] += 1;
    }
    return parts.join('.');
}

if (!targetVersion) {
    targetVersion = currentVersion;
} else if (['patch', 'minor', 'major'].includes(targetVersion.toLowerCase())) {
    targetVersion = bump(currentVersion, targetVersion.toLowerCase());
} else if (!/^\d+\.\d+\.\d+/.test(targetVersion)) {
    console.error(`Invalid version format: "${targetVersion}". Expected semver (e.g. 1.0.1) or patch|minor|major.`);
    process.exit(1);
}

console.log(`\n🔄 [${pkgName}] Syncing version: ${currentVersion} -> ${targetVersion}\n`);

// 1. Update package.json
if (pkg.version !== targetVersion) {
    pkg.version = targetVersion;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    console.log(`✔ Updated package.json version to ${targetVersion}`);
} else {
    console.log(`ℹ package.json already at ${targetVersion}`);
}

// 2. Update src/*.js JSDoc banner (@version)
if (fs.existsSync(srcDir)) {
    const srcFiles = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'));
    srcFiles.forEach(file => {
        const filePath = path.join(srcDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        const updated = content.replace(/(\*\s*@version\s+)[\d\.\w\-]+/g, `$1${targetVersion}`);
        if (updated !== content) {
            fs.writeFileSync(filePath, updated, 'utf8');
            console.log(`✔ Updated src/${file} @version banner to ${targetVersion}`);
        }
    });
}

// 3. Update README.md (CDN URLs & badges)
if (fs.existsSync(readmePath) && pkgName) {
    let readme = fs.readFileSync(readmePath, 'utf8');
    const pkgEscaped = pkgName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const cdnRegex = new RegExp(`(${pkgEscaped}@)[\\d\\.\\w\\-]+(\\S*)`, 'g');
    const badgeRegex = new RegExp(`(\\/package\\/${pkgEscaped}\\/)[\\d\\.\\w\\-]+`, 'g');

    let updated = readme.replace(cdnRegex, `$1${targetVersion}$2`);
    updated = updated.replace(badgeRegex, `$1${targetVersion}`);

    if (updated !== readme) {
        fs.writeFileSync(readmePath, updated, 'utf8');
        console.log(`✔ Updated README.md CDN references to ${targetVersion}`);
    } else {
        console.log(`ℹ README.md already up to date`);
    }
}

// 4. Update Preview Pages in src/pages/plugin-preview/*.html
if (fs.existsSync(previewsDir) && pkgName) {
    const previewFiles = fs.readdirSync(previewsDir).filter(f => f.endsWith('.html'));
    const pkgEscaped = pkgName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const previewRegex = new RegExp(`(${pkgEscaped}@)[\\d\\.\\w\\-]+(\\/dist\\/[\\w\\.\\-]+)`, 'g');

    previewFiles.forEach(pFile => {
        const pPath = path.join(previewsDir, pFile);
        let pContent = fs.readFileSync(pPath, 'utf8');
        if (previewRegex.test(pContent)) {
            previewRegex.lastIndex = 0;
            const pUpdated = pContent.replace(previewRegex, `$1${targetVersion}$2`);
            if (pUpdated !== pContent) {
                fs.writeFileSync(pPath, pUpdated, 'utf8');
                console.log(`✔ Updated ${pFile} CDN references to ${targetVersion}`);
            }
        }
    });
}

// 5. Run local build.js to regenerate dist/ files
const buildScript = path.join(pluginDir, 'scripts', 'build.js');
if (fs.existsSync(buildScript)) {
    console.log('\n🔨 Rebuilding dist artifacts...');
    try {
        execSync('node scripts/build.js', { cwd: pluginDir, stdio: 'inherit' });
        console.log(`\n🎉 Successfully synced version ${targetVersion} for ${pkgName} & rebuilt dist/!\n`);
    } catch (err) {
        console.error('Error during build:', err.message);
        process.exit(1);
    }
} else {
    console.log(`\n🎉 Successfully synced version ${targetVersion} for ${pkgName}!\n`);
}
