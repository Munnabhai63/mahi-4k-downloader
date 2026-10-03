$env:RUSTUP_HOME = "F:\rustup"
$env:CARGO_HOME = "F:\cargo"
$env:CARGO_TARGET_DIR = "F:\cargo_target\turbograb"
& F:\cargo\bin\cargo.exe build --release --manifest-path apps/desktop/src-tauri/Cargo.toml
