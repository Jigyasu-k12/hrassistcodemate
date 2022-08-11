import React, {useContext, useEffect, useState} from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ScrollView,
    TextInput,
    SafeAreaView,
    Alert
  } from 'react-native';
import axios from "axios";
import { API_SERVICES_URL } from "../API/Api";
import Toast from 'react-native-simple-toast';
import AuthContext from '../context/AuthContext';

export const PostMethode =  async (url, data, token, context=null) => {
    let PostUrl = API_SERVICES_URL + url;
    // console.log("Api url", PostUrl, data);

    try {
        let response = await axios({
            method: "post",
            url: PostUrl,
            data: data,
            headers: {
                Accept: "application/json",
                authToken: token,
            }
        });
        return response.data;
    } catch (error) {
            throw error
    }

return







/*

    try {
        let response = await axios.post(PostUrl, JSON.stringify(data), {
            headers: {
                'Content-Type ': "application/json",
                // Accept :"application/json",
                authToken: token,
            }
        })
        // console.log("Api resp",response)
        return response.data;
    } catch (error) {
        throw handleError(error.toJSON())
        // return new Error(error);
        return Promise.reject(error);
        // console.log(error);
        if (error.response) {
            if(context && error.response.status== 403){
                UseLogout(context);
                throw handleError(error)
            }else{
                throw handleError(error)
            }        
            // console.log(error.response.data);
            // console.log(error.response.status);
            // console.log(error.response.headers);
        }else{
            throw handleError(error)
        }
        
    }
    */
    
}

export const getRawurl = async (url, data, token) => {

    try {
        let response = await axios.get(url, {
            headers: {
                'Content-Type ': "application/json",
                // Accept :"application/json",
                authToken: token,
            }
        })
        // console.log("Api resp",response)
        return response.data;
    } catch (error) {
        throw handleError(error)
    }
}


const handleError = (err) => {
    let error = err;
    if (err.response && err.response.data.hasOwnProperty('message'))
        error = err.response.data;
    else if (!err.hasOwnProperty('message')) error = err.toJSON();
    return new Error(error.message);
}

export const showErrorMessage = (error, context=null) => {
    console.log(error.response.status);
    console.log(error.response.data);
    if (error.response) {
        if(error.response.status == "403" || error.response.status == "401"){
            UseLogout(context);
            return;
        }else if (error.response && error.response.data.hasOwnProperty('Message')){
            Toast.show(error.response.data.Message);    
            return;
        }
        Toast.show(error.toString());
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log(error.request);
        Toast.show("Network Error");
      } else {
        Toast.show("Something Went Wrong");
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message);
      }
}


const UseLogout = (context) => {
    context.signOut(),
    Alert.alert(
        "Unauthorised",
        "Session Expired login again",
        [
          { text: "OK", 
        //   onPress: () => context.signOut(),
           style: "cancel"}
        ]
      );
}