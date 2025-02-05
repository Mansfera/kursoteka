git add .
# Check if there are any changes to commit
if git diff --exit-code HEAD; then
    echo "No changes to commit"
else
    # Get formatted date (hh:mm:ss dd.mm.yyyy)
    date_formatted=$(date "+%H:%M:%S %d.%m.%Y")
    git commit -a -m "Auto update ${date_formatted}"
    git push
fi
git pull
