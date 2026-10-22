#!/bin/sh
# Prints a kubeconfig for the docs/github-deployer ServiceAccount, for this
# repo's KUBECONFIG secret:
#   k8s/kubeconfig.sh | gh secret set KUBECONFIG -R cloider/docs
set -eu
CONTEXT="${CONTEXT:-prod}"

server="$(kubectl config view --minify --context "$CONTEXT" -o jsonpath='{.clusters[0].cluster.server}')"
ca="$(kubectl --context "$CONTEXT" -n docs get secret github-deployer-token -o jsonpath='{.data.ca\.crt}')"
token="$(kubectl --context "$CONTEXT" -n docs get secret github-deployer-token -o jsonpath='{.data.token}' | base64 -d)"

cat <<KUBECONFIG
apiVersion: v1
kind: Config
clusters:
  - name: prod
    cluster:
      server: $server
      certificate-authority-data: $ca
users:
  - name: github-deployer
    user:
      token: $token
contexts:
  - name: docs
    context:
      cluster: prod
      user: github-deployer
      namespace: docs
current-context: docs
KUBECONFIG
