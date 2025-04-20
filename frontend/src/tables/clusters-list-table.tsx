import React from "react";
import { connect } from 'react-redux';
import IsManager from 'components/is_manager';
import {
    clustersListUpdateFunc
} from 'redux/actions';
import Table from './list-table';
import { ClustersList } from "components/types";
import { DenormalizedRow } from "carbon-components-react";
import { RootState } from "redux/reducers";
import TornjakApi from 'components/tornjak-api-helpers';

// ClusterListTable takes in 
// listTableData: clusters data to be rendered on table
// returns clusters data inside a carbon component table with specified functions

type ClustersListTableProp = {
    // dispatches a payload for list of clusters with their metadata info as an array of ClustersList Type and has a return type of void
    clustersListUpdateFunc: (globalClustersList: ClustersList[]) => void,
    // data provided to the clusters table
    data: {
        key: string,
        props: { cluster: ClustersList }
    }[] | string | JSX.Element[],
    id: string,
    // list of clusters with their metadata info as an array of ClustersList Type
    globalClustersList: ClustersList[],
    // the selected server for manager mode 
    globalServerSelected: string,
}

type ClustersListTableState = {
    listData: { key: string, props: { cluster: ClustersList } }[] | ClustersList[] | string | JSX.Element[],
    listTableData: {
        id: string;
        clusterName: string;
        clusterType: string;
        clusterManagedBy: string;
        clusterDomainName: string;
        clusterAssignedAgents: { props: { children: string } }
    }[]

}
class ClustersListTable extends React.Component<ClustersListTableProp, ClustersListTableState> {
    TornjakApi: TornjakApi;
    constructor(props: ClustersListTableProp) {
        super(props);
        this.TornjakApi = new TornjakApi(props);
        this.state = {
            listData: props.data,
            listTableData: [],
        };
        this.prepareTableData = this.prepareTableData.bind(this);
        this.deleteCluster = this.deleteCluster.bind(this);
    }

    componentDidMount() {
        this.prepareTableData();
    }
    componentDidUpdate(prevProps: ClustersListTableProp) {
        if (prevProps !== this.props) {
            this.setState({
                listData: this.props.globalClustersList
            })
            this.prepareTableData();
        }
    }

    prepareTableData() {
        const { data } = this.props;
        if (typeof data === "string" || data === undefined) return;
      
        const listTableData = data.map((item: { props: { cluster: ClustersList } }, index: number) => {
          const { cluster } = item.props;
      
          return {
            id: (index + 1).toString(),
            clusterName: cluster.name,
            clusterType: cluster.platformType,
            clusterManagedBy: cluster.managedBy,
            clusterDomainName: cluster.domainName,
            clusterAssignedAgents: <pre>{JSON.stringify(cluster.agentsList, null, ' ')}</pre>
          };
        });
      
        this.setState({ listTableData });
      }

    deleteCluster(selectedRows: readonly DenormalizedRow[]) {
        if (!selectedRows || selectedRows.length === 0) return "";
        let cluster: { name: string }[] = [], successMessage

        for (let i = 0; i < selectedRows.length; i++) {
            cluster[i] = { name: selectedRows[i].cells[1].value };
            if (IsManager) {
                successMessage = this.TornjakApi.clusterDelete(this.props.globalServerSelected, { cluster: cluster[i] }, this.props.clustersListUpdateFunc, this.props.globalClustersList);
            } else {
                successMessage = this.TornjakApi.localClusterDelete({ cluster: cluster[i] }, this.props.clustersListUpdateFunc, this.props.globalClustersList);
            }
            successMessage.then(function (result) {
                if (result === "SUCCESS") {
                    window.alert(`CLUSTER "${cluster[i].name}" DELETED SUCCESSFULLY!`);
                    window.location.reload();
                } else {
                    window.alert(`Error deleting cluster "${cluster[i].name}": ` + result);
                }
                return;
            })
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
                header: 'Cluster Name',
                key: 'clusterName',
            },
            {
                header: 'Cluster Type',
                key: 'clusterType',
            },
            {
                header: 'Cluster Managed By',
                key: 'clusterManagedBy',
            },
            {
                header: 'Cluster Domain Name',
                key: 'clusterDomainName',
            },
            {
                header: 'Assigned Agents',
                key: 'clusterAssignedAgents',
            },
        ];
        return (
            <div>
                <Table
                    entityType={"Cluster"}
                    listTableData={listTableData}
                    headerData={headerData}
                    deleteEntity={this.deleteCluster}
                    banEntity={undefined}
                    downloadEntity={undefined} />
            </div>
        );
    }
}

const mapStateToProps = (state: RootState) => ({
    globalServerSelected: state.servers.globalServerSelected,
    globalClustersList: state.clusters.globalClustersList,
})

export default connect(
    mapStateToProps,
    { clustersListUpdateFunc }
)(ClustersListTable)