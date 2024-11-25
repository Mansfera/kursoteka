# Git fix:
chmod -R u+w .git/objects
sudo chown -R kursoteka:kursoteka .git
chmod 755 /home/kursoteka/public_html
chmod 644 /home/kursoteka/public_html/courses.json
sudo chown kursoteka:kursoteka /home/kursoteka/public_html/
chmod +x start.sh
chmod +x update.sh