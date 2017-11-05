#!/bin/bash

name="$1"
date=$(date +'%Y%m%d%H%M')
file="./migrations/${date}_${name}.go"

echo $file
touch $file
