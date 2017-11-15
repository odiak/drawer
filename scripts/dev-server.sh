#!/bin/bash

while true; do
    find . -name '*.go' | entr -dr go run *.go
    [ "$?" = "130" ] && break
done
