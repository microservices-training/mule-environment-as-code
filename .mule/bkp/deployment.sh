
echo "=== Deployment has started! ==="

#check input arguments
if [[ $# -eq 0 ]] ; then
    echo "ERROR: Please, pass the filename for environment descritor as an argument!"
    exit 1
fi

#filename passed as script argument
filename="$1"

#Call Anypoint API to execute deployment and all the required configuration
echo '=== Invoke Anypoint API'
{ #try
	node .mule/deployment-method/cloudhub/deployment-cloudhub.js $filename

	# Only start ARM deployment if the Cloud deployment were successful
	if [ "$?" -eq "0" ];
    then
        node .mule/deployment-method/arm/deployment-arm.js $filename
    fi
} || { #catch
	echo "=== ERROR: Error during deployment"
	exit 1
}

echo "=== Deployment has finished successfully! ==="