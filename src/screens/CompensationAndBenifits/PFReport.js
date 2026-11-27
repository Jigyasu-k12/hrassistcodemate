//import libraries
import React, {useState, useContext} from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import AuthContext from '../../context/AuthContext';
import Spinner from 'react-native-loading-spinner-overlay/lib';
import { ThemeGlobalColor as GlobalColor, ThemeColor } from '../../constants/Colors';
import Text from '../../components/reusable/Text';
import * as ApiService from '../../Utils/Utils';
import Toast from 'react-native-simple-toast';
import moment from 'moment';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const PFReport = () => {
  const [loader, setLoader] = useState(false);
  const [reportData, setReportData] = useState([]);
  const {authContext, AppUserData} = useContext(AuthContext);
  const [activityLogModal, setActivityLogModal] = useState(false);
  const [activityLogData, setActivityLogData] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [purposeMasterData, setPurposeMasterData] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      fetchPFReport();
      fetchPFMaster();
    }, []),
  );

  const formatDate = dateStr => {
    if (!dateStr) return '-';
    try {
      return moment(dateStr, 'DD-MMM-YYYY HH:mm:ss').format('DD-MMM-YYYY');
    } catch {
      return dateStr;
    }
  };

  const fetchPFReport = () => {
    let apiData = {
      EmployeeID: AppUserData?.data?.userId,
    };
    let token = AppUserData.token;
    console.log('PF Report Request:', apiData);
    setLoader(true);
    ApiService.PostMethode('/GetPFRequest', apiData, token, authContext)
      .then(result => {
        console.log('PF Report Response:', result);
        setLoader(false);
        if (result.Value && Array.isArray(result.Value)) {
          // Sort by REQUEST DATE in descending order (newest first)
          const sortedData = [...result.Value].sort((a, b) => {
            const dateA = moment(a['REQUEST DATE'], 'DD-MMM-YYYY HH:mm:ss');
            const dateB = moment(b['REQUEST DATE'], 'DD-MMM-YYYY HH:mm:ss');
            return dateB - dateA; // Descending order
          });
          setReportData(sortedData);
          if (result.Value.length === 0)
            Toast.show('No data found', Toast.SHORT);
        } else {
          setReportData([]);
          Toast.show('No data found', Toast.SHORT);
        }
      })
      .catch(error => {
        setLoader(false);
        console.log('PF Report Error:', error);
        setReportData([]);
        ApiService.showErrorMessage(error, authContext);
      });
  };

  const fetchActivityLog = requestId => {
    const compCode = AppUserData?.data?.compCode || '101';
    let apiData = {
      AppName: 'PFAUTOMATION',
      CompCode: compCode,
      RequestID: requestId,
    };
    let token = AppUserData.token;
    console.log('Activity Log Request:', apiData);
    setLoader(true);
    ApiService.PostMethode('/GetWorflowHistory', apiData, token, authContext)
      .then(result => {
        console.log('Activity Log Response:', result);
        setLoader(false);
        if (result.Value && Array.isArray(result.Value)) {
          setActivityLogData(result.Value);
          setActivityLogModal(true);
          if (result.Value.length === 0)
            Toast.show('No activity log found', Toast.SHORT);
        } else {
          setActivityLogData([]);
          Toast.show('No activity log found', Toast.SHORT);
        }
      })
      .catch(error => {
        setLoader(false);
        console.log('Activity Log Error:', error);
        setActivityLogData([]);
        ApiService.showErrorMessage(error, authContext);
      });
  };

  const handleActivityLogPress = requestId => {
    setSelectedRequestId(requestId);
    fetchActivityLog(requestId);
  };

  const fetchPFMaster = () => {
    let apiData = {
      PuprposeCode: '',
    };
    let token = AppUserData.token;
    console.log('PF Master Request:', apiData);
    ApiService.PostMethode('/GetPFMaster', apiData, token, authContext)
      .then(result => {
        console.log('PF Master Response:', result);
        if (result.Value && Array.isArray(result.Value)) {
          setPurposeMasterData(result.Value);
        } else {
          setPurposeMasterData([]);
        }
      })
      .catch(error => {
        console.log('PF Master Error:', error);
        setPurposeMasterData([]);
        ApiService.showErrorMessage(error, authContext);
      });
  };

  const getPurposeDescription = purposeCode => {
    if (!purposeCode) return '-';
    const purpose = purposeMasterData.find(
      item => item['PURPOSE CODE'] === purposeCode,
    );
    return purpose ? purpose['PURPOSE DESC'] : purposeCode;
  };

  const renderActivityLogItem = ({item, index}) => (
    <View style={styles.activityLogCard}>
      <View style={styles.activityLogHeader}>
        <Text style={styles.activitySeqNo} Bold>
          Step {index + 1}
        </Text>
        <Text style={styles.activityStatus}>{item.WFLH_STATUS}</Text>
      </View>
      <View style={styles.activityLogTable}>
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Assigned To:</Text>
          <Text style={styles.tableValue}>{item.WFLH_ASSIGNED_TO || '-'}</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Role:</Text>
          <Text style={styles.tableValue}>
            {item.WFLH_ASSIGNEE_ROLE || '-'}
          </Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Department:</Text>
          <Text style={styles.tableValue}>
            {item.WFLH_ASSIGNEE_DEPT || '-'}
          </Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Designation:</Text>
          <Text style={styles.tableValue}>
            {item.WFLH_ASSIGNEE_DESG || '-'}
          </Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Assigned On:</Text>
          <Text style={styles.tableValue}>
            {formatDate(item.WFLH_ASSIGNED_ON)}
          </Text>
        </View>
        {item.WFLH_DUE_DATE && (
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Due Date:</Text>
            <Text style={styles.tableValue}>
              {formatDate(item.WFLH_DUE_DATE)}
            </Text>
          </View>
        )}
        {item.WFLH_ACTION_TAKEN && (
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Action Taken:</Text>
            <Text style={[styles.tableValue, styles.actionTaken]}>
              {item.WFLH_ACTION_TAKEN}
            </Text>
          </View>
        )}
        {item.WFLH_ACTION_BY && (
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Action By:</Text>
            <Text style={styles.tableValue}>{item.WFLH_ACTION_BY}</Text>
          </View>
        )}
        {item.WFLH_ACTION_DATE && (
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Action Date:</Text>
            <Text style={styles.tableValue}>
              {formatDate(item.WFLH_ACTION_DATE)}
            </Text>
          </View>
        )}
        {item.WFLH_NEW_STATUS && (
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>New Status:</Text>
            <Text style={[styles.tableValue, styles.newStatus]}>
              {item.WFLH_NEW_STATUS}
            </Text>
          </View>
        )}
        {item.WFLH_COMMENTS && (
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Comments:</Text>
            <Text style={styles.tableValue}>{item.WFLH_COMMENTS}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderReportItem = ({item}) => (
    <View style={styles.reportCard}>
      <View style={styles.cardHeader}>
        <View style={{flex: 1, marginRight: 10}}>
          <Text style={styles.requestId} Bold>
            Request ID: {item['REQ NO']}
          </Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <View style={[styles.statusBadge, getStatusColor(item['STATUS'])]}>
            <Text style={styles.statusText}>{item['STATUS']}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardRow}>
        <View style={styles.cardColumn}>
          <Text style={styles.label}>Purpose</Text>
          <Text style={styles.value}>
            {getPurposeDescription(item['PURPOSE CODE'])}
          </Text>
        </View>
        <View style={styles.cardColumn}>
          <Text style={styles.label}>Request Date</Text>
          <Text style={styles.value}>{formatDate(item['REQUEST DATE'])}</Text>
        </View>
      </View>

      <View style={styles.cardRow}>
        <View style={styles.cardColumn}>
          <Text style={styles.label}>Requested Amount</Text>
          <Text style={[styles.value, styles.amountText]}>
            ₹{item['REQUESTED AMOUNT'] || '0'}
          </Text>
        </View>
        {item['FINAL APPRVD AMT'] && (
          <View style={styles.cardColumn}>
            <Text style={styles.label}>Approved Amount</Text>
            <Text style={[styles.value, styles.approvedAmount]}>
              ₹{item['FINAL APPRVD AMT']}
            </Text>
          </View>
        )}
      </View>

      {item['ELIGIBLE AMOUNT'] && (
        <View style={styles.cardRow}>
          <View style={styles.cardColumn}>
            <Text style={styles.label}>Eligible Amount</Text>
            <Text style={styles.value}>
              ₹{parseFloat(item['ELIGIBLE AMOUNT']).toFixed(2)}
            </Text>
          </View>
          <View style={styles.cardColumn}>
            <Text style={styles.label}>Total PF Balance</Text>
            <Text style={styles.value}>
              ₹
              {item['TOTAL PF BAL']
                ? parseFloat(item['TOTAL PF BAL']).toFixed(2)
                : '-'}
            </Text>
          </View>
        </View>
      )}

      {(item['EMPLOYEE SHARE BAL'] || item['EMPLOYER SHARE BAL']) && (
        <View style={styles.cardRow}>
          <View style={styles.cardColumn}>
            <Text style={styles.label}>Employee Share</Text>
            <Text style={styles.value}>
              ₹
              {item['EMPLOYEE SHARE BAL']
                ? parseFloat(item['EMPLOYEE SHARE BAL']).toFixed(2)
                : '0'}
            </Text>
          </View>
          <View style={styles.cardColumn}>
            <Text style={styles.label}>Employer Share</Text>
            <Text style={styles.value}>
              ₹
              {item['EMPLOYER SHARE BAL']
                ? parseFloat(item['EMPLOYER SHARE BAL']).toFixed(2)
                : '0'}
            </Text>
          </View>
        </View>
      )}

      {item['MAKER REMARKS'] && (
        <View style={styles.cardRow}>
          <View style={[styles.cardColumn, {flex: 1}]}>
            <Text style={styles.label}>Maker Remarks</Text>
            <Text style={styles.value}>{item['MAKER REMARKS']}</Text>
          </View>
        </View>
      )}

      {item['CHECKER REMARKS'] && (
        <View style={styles.cardRow}>
          <View style={[styles.cardColumn, {flex: 1}]}>
            <Text style={styles.label}>Checker Remarks</Text>
            <Text style={styles.value}>{item['CHECKER REMARKS']}</Text>
          </View>
        </View>
      )}

      {item['REJECTION REASON'] && (
        <View style={styles.cardRow}>
          <View style={[styles.cardColumn, {flex: 1}]}>
            <Text style={[styles.label, {color: '#F44336'}]}>
              Rejection Reason
            </Text>
            <Text style={[styles.value, {color: '#F44336'}]}>
              {item['REJECTION REASON']}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.activityLogButton]}
          onPress={() => handleActivityLogPress(item['REQ NO'])}>
          <MaterialIcons name="history" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Activity Log</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getStatusColor = status => {
    if (!status) return styles.statusDefault;
    const statusLower = status.toLowerCase();
    if (statusLower.includes('batch creation')) return styles.statusApproved;
    if (statusLower.includes('approved')) return styles.statusApproved;
    if (statusLower.includes('rejected')) return styles.statusRejected;
    if (statusLower.includes('submitted')) return styles.statusSubmitted;
    if (statusLower.includes('sent back')) return styles.statusSentBack;
    return styles.statusDefault;
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <Spinner
        visible={loader}
        textContent={'Loading...'}
        textStyle={styles.spinnerTextStyle}
      />

      <View style={styles.container}>
        <FlatList
          data={reportData}
          renderItem={renderReportItem}
          keyExtractor={(item, index) => `${item['REQ NO']}_${index}`}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No reports available</Text>
            </View>
          }
        />
      </View>

      {/* Activity Log Modal */}
      <Modal
        visible={activityLogModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setActivityLogModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle} Bold>
                Activity Log
              </Text>
              <Text style={styles.modalSubtitle}>
                Request ID: {selectedRequestId}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setActivityLogModal(false)}
              style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={activityLogData}
            renderItem={renderActivityLogItem}
            keyExtractor={(item, index) => `${item.WFLH_SEQ_NO}_${index}`}
            contentContainerStyle={styles.modalListContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="history" size={60} color="#ccc" />
                <Text style={styles.emptyText}>No activity log available</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: GlobalColor.PrimaryLight},
  listContainer: {padding: 10, paddingBottom: 20},
  reportCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cardHeaderRight: {flexDirection: 'row', alignItems: 'center', flexShrink: 0},
  requestId: {fontSize: 15, color: '#333', flexWrap: 'wrap'},
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    minWidth: 80,
  },
  statusText: {fontSize: 11, color: '#fff', fontWeight: 'bold'},
  statusApproved: {backgroundColor: '#4CAF50'},
  statusRejected: {backgroundColor: '#F44336'},
  statusSubmitted: {backgroundColor: '#FF9800'},
  statusSentBack: {backgroundColor: '#9C27B0'},
  statusDefault: {backgroundColor: '#9E9E9E'},
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardColumn: {flex: 1, marginRight: 10},
  label: {fontSize: 12, color: '#666', marginBottom: 3},
  value: {fontSize: 13, color: '#333', fontWeight: '500'},
  amountText: {color: ThemeColor.Teal, fontWeight: 'bold'},
  approvedAmount: {color: '#4CAF50', fontWeight: 'bold'},
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  activityLogButton: {backgroundColor: ThemeColor.Teal},
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {fontSize: 16, color: '#999', marginTop: 10},
  spinnerTextStyle: {color: '#fff'},
  modalContainer: {flex: 1, backgroundColor: GlobalColor.PrimaryLight},
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalTitle: {fontSize: 20, color: ThemeColor.Teal},
  modalSubtitle: {fontSize: 13, color: '#666', marginTop: 2},
  closeButton: {padding: 5},
  modalListContainer: {padding: 15, paddingBottom: 30},
  activityLogCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  activityLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: ThemeColor.Teal,
  },
  activitySeqNo: {fontSize: 16, color: ThemeColor.Teal},
  activityStatus: {fontSize: 13, color: '#666', fontWeight: '600'},
  activityLogTable: {width: '100%'},
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tableLabel: {flex: 0.4, fontSize: 12, color: '#666', fontWeight: '600'},
  tableValue: {flex: 0.6, fontSize: 12, color: '#333'},
  actionTaken: {color: '#4CAF50', fontWeight: 'bold'},
  newStatus: {color: ThemeColor.Teal, fontWeight: 'bold'},
});

export default PFReport;
