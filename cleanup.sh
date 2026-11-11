#!/bin/sh
# Run once inside ~/voosita-web after unzipping the new archive.
# Removes files that no longer exist in this version (unzip does not delete them).
rm -f components/section-page.tsx app/profile/page.tsx
rmdir app/profile 2>/dev/null
echo "cleanup done"
