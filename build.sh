#!/bin/bash
# Build script: assemble SMBDIS.ASM into a .nes ROM using asm6f
# Note: CHR-ROM (graphics data) is NOT included in the disassembly source.
# The assembled ROM will have a blank CHR-ROM placeholder.
# To play the game, provide your own complete .nes ROM file.

set -e

ASM6F="${ASM6F:-/tmp/asm6f/asm6f}"
SRC="SMBDIS.ASM"
WRAPPER="smb_build.asm"
OUTPUT="smb.nes"

if [ ! -x "$ASM6F" ]; then
  echo "Error: asm6f not found at $ASM6F"
  echo "Build asm6f first: cd /tmp && git clone https://github.com/freem/asm6f.git && cd asm6f && gcc -o asm6f asm6f.c -O2"
  exit 1
fi

# Create wrapper ASM file with iNES header and CHR-ROM placeholder
cat > "$WRAPPER" << 'ENDASM'
; ============================================================
; Super Mario Bros. - asm6f build wrapper
; ============================================================
; iNES Header
  INESPRG 2   ; 2 x 16KB PRG-ROM = 32KB
  INESCHR 1   ; 1 x 8KB CHR-ROM
  INESMAP 0   ; Mapper 0 (NROM)
  INESMIR 1   ; Vertical mirroring

; Include the main source (preprocessed to remove x816 directives)
  INCLUDE "smb_clean.asm"

; Pad PRG-ROM to exactly 32KB (from $8000 to $FFFF)
; The interrupt vectors at $FFFA-$FFFF are already in the source.

; CHR-ROM placeholder (8KB)
; Without original character ROM data, graphics will be blank.
; Replace this section with real CHR-ROM data to get working graphics.
  DSB 8192, $00
ENDASM

# Create cleaned source: remove x816-only directives
sed -e '/^\s*\.index\s/d' -e '/^\s*\.mem\s/d' "$SRC" > smb_clean.asm

echo "Assembling $OUTPUT..."
"$ASM6F" "$WRAPPER" "$OUTPUT" 2>&1

if [ -f "$OUTPUT" ]; then
  SIZE=$(wc -c < "$OUTPUT")
  echo "Build successful: $OUTPUT ($SIZE bytes)"
  echo ""
  echo "NOTE: This ROM has a blank CHR-ROM (no graphics data)."
  echo "The game logic works but tiles/sprites will be invisible."
  echo "To play, load your own complete .nes ROM file in the browser player."
else
  echo "Build failed."
  exit 1
fi
