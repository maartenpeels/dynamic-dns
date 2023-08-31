sudo chmod +x ddns.sh
sudo mv ddns.sh /usr/local/bin
crontab -l | { cat; echo "0 * * * * /usr/local/bin/ddns.sh"; } | crontab -
/usr/local/bin/ddns.sh
