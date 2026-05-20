// push_to_github.js
// -------------------------------------------------------------------
// Script untuk commit dan push kode lokal ke GitHub repository.
// Jalankan: node push_to_github.js "pesan commit anda"
// -------------------------------------------------------------------

const { execSync } = require('child_process');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const GITHUB_REPO = 'https://github.com/vamospoolid/optik.git';
const BRANCH = 'main';

function run(cmd, options = {}) {
    const opts = {
        cwd: PROJECT_ROOT,
        stdio: 'inherit',
        encoding: 'utf-8',
        ...options,
    };
    console.log(`\n🔧 Menjalankan: ${cmd}`);
    try {
        return execSync(cmd, opts);
    } catch (err) {
        console.error(`❌ Gagal: ${cmd}`);
        throw err;
    }
}

function runSilent(cmd) {
    try {
        return execSync(cmd, { cwd: PROJECT_ROOT, encoding: 'utf-8' }).trim();
    } catch {
        return '';
    }
}

async function main() {
    // Ambil commit message dari argument, atau gunakan default
    const commitMessage = process.argv.slice(2).join(' ')
        || `Update ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`;

    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║          📤 PUSH TO GITHUB - Optik88              ║');
    console.log('╚═══════════════════════════════════════════════════╝');
    console.log(`📝 Commit message: "${commitMessage}"`);
    console.log(`📂 Project root:   ${PROJECT_ROOT}`);
    console.log(`🌿 Branch:         ${BRANCH}`);

    // Step 1: Cek apakah sudah ada git repo
    const gitStatus = runSilent('git status --porcelain');
    if (gitStatus === null) {
        console.log('\n⚙️ Inisialisasi Git repository...');
        run('git init');
        run(`git remote add origin ${GITHUB_REPO}`);
    }

    // Step 2: Pastikan remote origin benar
    const currentRemote = runSilent('git remote get-url origin');
    if (currentRemote && currentRemote !== GITHUB_REPO) {
        console.log(`\n⚠️ Remote origin saat ini: ${currentRemote}`);
        console.log(`🔄 Mengubah ke: ${GITHUB_REPO}`);
        run(`git remote set-url origin ${GITHUB_REPO}`);
    } else if (!currentRemote) {
        run(`git remote add origin ${GITHUB_REPO}`);
    }

    // Step 3: Cek apakah ada perubahan
    if (!gitStatus) {
        console.log('\n✅ Tidak ada perubahan untuk di-commit.');
        console.log('💡 Jika ingin force push, jalankan manual: git push -f origin main');
        return;
    }

    // Step 4: Tampilkan ringkasan perubahan
    console.log('\n📊 Ringkasan perubahan:');
    const statusLines = gitStatus.split('\n').filter(Boolean);
    let added = 0, modified = 0, deleted = 0, untracked = 0;
    statusLines.forEach(line => {
        const code = line.substring(0, 2).trim();
        if (code === 'A') added++;
        else if (code === 'M') modified++;
        else if (code === 'D') deleted++;
        else if (code === '??') untracked++;
    });
    console.log(`   ➕ Baru:       ${added + untracked} file`);
    console.log(`   ✏️ Diubah:     ${modified} file`);
    console.log(`   🗑️ Dihapus:    ${deleted} file`);
    console.log(`   📁 Total:      ${statusLines.length} file`);

    // Step 5: Add semua file
    console.log('\n📦 Menambahkan semua file ke staging...');
    run('git add -A');

    // Step 6: Commit
    console.log('\n💾 Membuat commit...');
    run(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`);

    // Step 7: Pastikan branch benar
    const currentBranch = runSilent('git branch --show-current');
    if (currentBranch !== BRANCH) {
        console.log(`\n🌿 Berpindah ke branch ${BRANCH}...`);
        run(`git checkout -B ${BRANCH}`);
    }

    // Step 8: Push ke GitHub
    console.log('\n🚀 Pushing ke GitHub...');
    run(`git push -u origin ${BRANCH}`);

    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║       ✅ BERHASIL PUSH KE GITHUB!                 ║');
    console.log('╚═══════════════════════════════════════════════════╝');
    console.log(`🔗 Repository: ${GITHUB_REPO}`);
    console.log(`🌿 Branch:     ${BRANCH}`);
    console.log(`📝 Commit:     ${commitMessage}`);
}

main().catch(err => {
    console.error('\n❌ Push gagal:', err.message);
    process.exit(1);
});
