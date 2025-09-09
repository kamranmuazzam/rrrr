#!/bin/bash

# Define version variables
old_version="result_app_version_.2.3"
version="result_app_version_.2.3"  # <-- bump this when needed

# Replace version strings, but exclude .git folder
LC_CTYPE=C find . -maxdepth 3 -type f -not -path "./.git/*" \
  -exec perl -pi -e "s/$old_version/$version/g" {} +

# Git config (only once per system, not needed every run normally)
git config --global user.name "Kamran"
git config --global user.email "kamranmuazzam@gmail.com"

# Sync with remote repo
git pull
# git pull --rebase origin main

# Commit and push version bump
git add --all
git commit -m "Updated version to $version"
git push -u origin main

# Create GitHub release
gh release create "v$version" \
  --title "Version $version" \
  --notes "Releasing $version 🎉" \
  --draft=false