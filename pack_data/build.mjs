import { compilePack } from "@foundryvtt/foundryvtt-cli";

// Compile a LevelDB compendium pack.
await compilePack("./AuraItems", "../packs/AuraItems", { log: true });
await compilePack("./Macros", "../packs/Macros", { log: true });
await compilePack("./ZoneActors", "../packs/ZoneActors", { log: true });
