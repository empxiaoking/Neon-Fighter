# Neon Fighter (霓虹战机) - Development Plan

## Design Guidelines

### Color Palette
- Background: #000000 / radial dark blue
- Player: #00FFFF (Cyan)
- Enemies: #FF00FF, #FF0066, #9D4EDD
- Bullets: #FFFF00
- Powerups: varied neon colors

### Typography
- Titles: Press Start 2P (pixel retro)
- HUD/Body: monospace

## Development Tasks

- [x] Create game types and constants file
- [x] Build main GameCanvas component with game loop
- [x] Implement player, enemies, bullets, powerups entities
- [x] Add collision detection system
- [x] Add particle explosion and screen shake effects
- [x] Build HUD with score, lives, powerup status
- [x] Build start screen and game over screen
- [x] Replace Index.tsx with the arcade game
- [x] Run lint and build checks
- [x] Stackable powerups with independent timers (+40% on re-pickup, cap 100%)
- [x] Define 6 skills (basic attack with 3 forms + 5 active skills with cooldowns)
- [x] Add XP/leveling system (60 levels, 1 skill point per level)
- [x] Build Diablo-4-style skill tree UI (press C to open)
- [x] Add skill hotbar HUD (Space, 1-5 with cooldowns)
- [x] Integrate skill effects into combat (bullets, beams, AOE, drones)
- [x] Run lint after skill system implementation
- [x] Add skill tree presets (Build templates) to the skill tree menu
- [x] Simplify SkillTree UI — presets show name only, remove tagline/description
- [x] Add "No CD" powerup (5s skill cooldown removed, stack up to 5s max)
- [x] Full skill-tree-design.md implementation — 5 schools × T0-T3 nodes + Paragon + Key Passive exclusivity
- [x] Pentagonal skill tree layout (5 schools arranged radially)
- [x] Key Passive selection with confirm dialog (only 1 active at a time)
- [x] Paragon panel (unlocks at level 50, 10 shared points)
- [x] Integrate new skill effects into GameCanvas combat
- [x] Update presets to use new skill tree node ids
- [x] Run lint and build after full redesign