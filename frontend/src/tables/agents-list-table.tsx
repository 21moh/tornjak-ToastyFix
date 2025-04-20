import React from "react";
import { connect } from 'react-redux';
import GetApiServerUri from 'components/helpers';
import IsManager from 'components/is_manager';
import axios from 'axios';
import {
    agentsListUpdateFunc
} from 'redux/actions';
import Table from './list-table';
import { AgentsList, AgentsWorkLoadAttestorInfo } from "components/types";
import { DenormalizedRow } from "carbon-components-react";
import { RootState } from "redux/reducers";
import { showResponseToast } from "components/error-api";
import apiEndpoints from 'components/apiConfig';

// AgentListTable takes in 
// listTableData: agents data to be rendered on table
// returns agents data inside a carbon component table with specified functions

type AgentsListTableProp = {
    // dispatches a payload for list of agents with their metadata info as an array of AgentListType and has a return type of void
    agentsListUpdateFunc: (globalAgentsList: AgentsList[]) => void,
    // list of available agents as array of AgentsListType
    globalAgentsList: AgentsList[],
    // 
    globalAgentsWorkLoadAttestorInfo: AgentsWorkLoadAttestorInfo[],
    // the selected server for manager mode 
    globalServerSelected: string,
    //
    data: {
        key: string,
        props: { agent: AgentsList }
    }[] | string | JSX.Element[],
    id: string
}

type AgentsListTableState = {
    listData: { key: string, props: { agent: AgentsList } }[] | AgentsList[] | string | JSX.Element[],
    listTableData: { id: string, [x: string]: string; }[]
}
class AgentsListTable extends React.Component<AgentsListTableProp, AgentsListTableState> {
    constructor(props: AgentsListTableProp) {
        super(props);
        this.state = {
            listData: props.data,
            listTableData: [{ "id": "0" }],
        };
        this.prepareTableData = this.prepareTableData.bind(this);
        this.deleteAgent = this.deleteAgent.bind(this);
        this.banAgent = this.banAgent.bind(this);
    }

    componentDidMount() {
        this.prepareTableData();
    }
    componentDidUpdate(prevProps: AgentsListTableProp) {
        if (prevProps !== this.props) {
            this.setState({
                listData: this.props.globalAgentsList
            })
            this.prepareTableData();
        }
    }

    prepareTableData() {
        const { data, globalAgentsWorkLoadAttestorInfo } = this.props;
        if (typeof data === "string" || data === undefined) return;
      
        const listTableData = data.map((item: { props: { agent: AgentsList } }, index: number) => {
          const { agent } = item.props;
          const spiffeid = `spiffe://${agent.id.trust_domain}${agent.id.path}`;
      
          let plugin = "No Plugin Configured For Agent";
          if (globalAgentsWorkLoadAttestorInfo !== undefined) {
            const match = globalAgentsWorkLoadAttestorInfo.find(a => a.spiffeid === spiffeid);
            if (match) plugin = match.plugin;
          }
      
          return {
            id: (index + 1).toString(),
            trustdomain: agent.id.trust_domain,
            spiffeid,
            info: JSON.stringify(agent, null, ' '),
            plugin
          };
        });
      
        this.setState({ listTableData });
      }

      deleteAgent(selectedRows: readonly DenormalizedRow[]) {
        if (!selectedRows || selectedRows.length === 0) return "";
      
        const prefix = "spiffe://";
        const endpoint = IsManager
          ? `${GetApiServerUri('/manager-api/agent/delete')}/${this.props.globalServerSelected}`
          : GetApiServerUri(apiEndpoints.spireAgentsApi);
      
        const agentsToDelete = selectedRows.map(row => {
          const trust_domain = row.cells[1].value;
          const path = row.cells[2].value.replace(`${prefix}${trust_domain}`, "");
          return { trust_domain, path };
        });
      
        const deleteRequests = agentsToDelete.map(agent =>
          axios.delete(endpoint, {
            data: { id: agent },
            headers: { 'Content-Type': 'application/json' },
            crossdomain: true
          })
        );
      
        Promise.all(deleteRequests)
          .then(() => {
            if (!this.props.globalAgentsList) return;
      
            let updatedAgentsList = [...this.props.globalAgentsList];
            agentsToDelete.forEach(agent => {
              updatedAgentsList = updatedAgentsList.filter(
                el => el.id.trust_domain !== agent.trust_domain || el.id.path !== agent.path
              );
            });
      
            this.props.agentsListUpdateFunc(updatedAgentsList);
            window.alert("Agents deleted successfully!");
          })
          .catch(error => showResponseToast(error, { caption: "Could not delete agent." }));
      }

    banAgent(selectedRows: readonly DenormalizedRow[]) {
        var id: { path: string; trust_domain: string }[] = [], i = 0, endpoint = "", prefix = "spiffe://"

        if (IsManager) {
            endpoint = GetApiServerUri('/manager-api/agent/ban') + "/" + this.props.globalServerSelected

        } else {
            endpoint = GetApiServerUri(apiEndpoints.spireAgentsBanApi)
        }

        if (selectedRows === undefined || !selectedRows) return ""

        for (i = 0; i < selectedRows.length; i++) {
            id[i] = { path: "", trust_domain: "" }
            id[i].trust_domain = selectedRows[i].cells[1].value
            id[i].path = selectedRows[i].cells[2].value.substr(selectedRows[i].cells[1].value.concat(prefix).length)

            axios.post(endpoint, { id: { trust_domain: id[i].trust_domain, path: id[i].path } })
                .then(res => {
                    alert("Ban SUCCESS")
                    this.componentDidMount()
                })
                .catch((error) => showResponseToast(error, { caption: "Could not ban agent." }))
        }
    }
    render() {
        const { listTableData } = this.state;
        const headerData = [
            {
                header: '#No',
                key: 'id',
            },
            {
                header: 'Trust Domain',
                key: 'trustdomain',
            },
            {
                header: 'SPIFFE ID',
                key: 'spiffeid',
            },
            {
                header: 'Info',
                key: 'info',
            },
            {
                header: 'Workload Attestor Plugin',
                key: 'plugin',
            }
        ]
        return (
            <div>
                <Table
                    entityType={"Agent"}
                    listTableData={listTableData}
                    headerData={headerData}
                    deleteEntity={this.deleteAgent}
                    banEntity={this.banAgent}
                    downloadEntity={undefined}
                />
            </div>
        )
    }
}

const mapStateToProps = (state: RootState) => ({
    globalServerSelected: state.servers.globalServerSelected,
    globalAgentsList: state.agents.globalAgentsList,
    globalAgentsWorkLoadAttestorInfo: state.agents.globalAgentsWorkLoadAttestorInfo,
})

export default connect(
    mapStateToProps,
    { agentsListUpdateFunc }
)(AgentsListTable)