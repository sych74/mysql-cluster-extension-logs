//@req(service, nodeId)

if (service == 'db') {
    cmd = 'if [ -x "$(command -v mysql)" ]; then  mysql -u ${this.db_user} -p${this.db_password} -e "quit"; elif '
    cmd += '[ -x "$(command -v psql)" ]; then export PGPASSWORD=${this.db_password}; psql -U ${this.db_user} -d postgres -c "\\q"; fi'
    mark = ['Access denied', 'authentication failed']
    warning = 'DB User and Password: authentication check failed. Please specify correct credentials for the database located in node' + nodeId + '.'
    return Check(cmd, mark, warning)
} 

if (service == 's3') {
    cmd = 'rpm -qa | grep -qw s3cmd || yum install -y epel-release && yum install -y s3cmd; s3cmd ls --access_key=${this.access_key} --secret_key=${this.secret_key} --host=${this.s3_host} --no-check-hostname'
    mark = ['SignatureDoesNotMatch']
    warning = 'S3 Credentials: authentication check failed. Please specify correct host and credentials for S3 storage.'
    return Check(cmd, mark, warning)
}

return {result: 99, error: 'Service + [' + service + '] not found'}

function Check(cmd, mark, warning){
    resp = ExecCmd(cmd)
    if (resp.result != 0) {
        for (var i = 0; i < mark.length; i++) {
            if (resp.responses[0].errOut.indexOf(mark[i]) > -1) {
                return {
                    result: 'warning',
                    message: warning
                }
            }
        }
        return resp
    }
    return {result: 0}
}

function ExecCmd(cmd){
    return jelastic.env.control.ExecCmdById('${env.envName}', session, nodeId, toJSON([{command: cmd}]), true, 'root');
} 
