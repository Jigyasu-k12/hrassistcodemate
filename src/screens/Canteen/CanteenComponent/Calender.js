import { useState } from "react";
import { SafeAreaView, } from "react-native";
import { ThemeGlobalColor as GlobalColor, ThemeColor } from "../../../constants/Colors";

const Calander = () => {
  const [date, setDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  return (
 
      <View style={{ paddingHorizental: 10 }} >
        <DatePicker
          modal
          open={open}
          date={date}
          onConfirm={date => {
            setOpen(false);
            setDate(date);
// $&
          }}
          onCancel={() => {
            setOpen(false);
          }}
        />
        <View
          style={{
            marginTop: 10,
            backgroundColor: ThemeColor.TealSoft,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',            
            paddingVertical: 6
          }}>
          <Text style={{ color: 'gray', fontWeight: '800' }}>
            (Todays Menu ) -- {moment(date).format('MMM Do YYYY')}
          </Text>
          <View>
            <View>
              <TouchableOpacity onPress={() => (setOpen(true))}>
                <Ionicons name="calendar-outline" size={25} color={ThemeColor.Teal} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    
  );
};
