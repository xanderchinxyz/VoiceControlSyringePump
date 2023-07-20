//import { StatusBar } from 'expo-status-bar';
import React, {useState, useEffect, Fragment} from "react";
import { Dropdown } from 'react-native-element-dropdown';
import Voice from '@react-native-community/voice';    //cant have bluetooth headset connected! or else will crash app
import Tts from 'react-native-tts';
import KeepAwake from 'react-native-keep-awake';

import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView,
  TouchableHighlight,
  Button,
  FlatList,
  TextInput,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';

const infuseRefill = [
  { label: 'Infuse', value: 0},
  { label: 'Refill', value: 1},
];

const concentrationUnits = [
  { label: 'mg/mL', value: 1 },
];

const patientWeightUnits = [
  { label: 'kg', value: 1 },
  // { label: 'lb', value: 2 },
];

const infusionRateUnits = [
  { label: 'mL/h', value: 1 },
];

const vtbiUnits = [
  { label: 'mcg', value: 1 },
];

const doseUnits = [
  { label: 'mcg/kg/min', value: 1 },
];

const syringes = [
  { label: 'BD Plastic 3cc', value: 8.66 },
  { label: 'BD Plastic 5cc', value: 12.06 },
  { label: 'BD Plastic 10cc', value: 14.5 },
  { label: 'BD Plastic 20cc', value: 19.13 },
];

const infusionWords = [
  'infusion',
  'confusion',
  'fusion',
];

const bolusWords = [
  'bolus',
  'bullet',
  'wallace',
  'boneless',
  'boss',
  'bullish',
  'bowlers',
  'booless',
  'Booless',
  'Polish',
  'police',
  'polis',
];

const doseWords = [
  'dose',
  'toast'
]

let currentVoiceWord = null;
let listeningState = false;
let recordingState = false;
let runState = false;
let trueInfusionRate = 0;
let trueBolusAmount = 0;
let trueDoseAmount = 0;
let trueSyringeDiameter = syringes[0].value;
let isSpeaking = false;
let trueDirection = 0;
let stringCommand = ""

export default function App() {
  console.log("App executed");

  const [result, setResult] = useState('')    //voice control result

  const [direction, setDirection] = React.useState(trueDirection);
  const [concentrationUnit, setConcentrationUnit] = React.useState(1);
  const [patientWeightUnit, setPatientWeightUnit] = React.useState(1);
  const [infusionRateUnit, setInfusionRateUnit] = React.useState(1);
  const [vtbiUnit, setVTBIUnit] = React.useState(1);
  const [doseUnit, setDoseUnit] = React.useState(1);
  const [syringeSize, setSyringeSize] = React.useState(trueSyringeDiameter);
  
  const [concentration, setConcentration] = React.useState(null);
  const [patientWeightAmount, setPatientWeightAmount] = React.useState(null);
  const [infusionRateAmount, setInfusionRateAmount] = React.useState(trueInfusionRate);
  const [vtbiAmount, setVTBIAmount] = React.useState(trueBolusAmount);
  const [doseAmount, setDoseAmount] = React.useState(trueDoseAmount);

  const [infusionRateFocus, setInfusionRateFocus] = React.useState(false);
  const [doseFocus, setDoseFocus] = React.useState(false);

  const [buttonState, changeButtonState] = React.useState(false);
  const [recordingStateButton, changeRecordingState] = React.useState(false);

  const onSpeechStartHandler = (e) => {
    console.log("start handler==>>>", e)
  }
  const onSpeechEndHandler = (e) => {
    console.log("stop handler", e)
    if(recordingState) {
      stopRecording();
      startRecording();
    }
  }
  const onSpeechResultsHandler = (e) => {
    setResult(e.value[0])
    if(
      !listeningState && e.value[0].toLowerCase().includes("hey syringe pump") ||
      !listeningState && e.value[0].toLowerCase().includes("hey siri inch pump") ||
      !listeningState && e.value[0].toLowerCase().includes("hey siri inch pub")
    ) {
      listeningState = true;
      Tts.stop();
      Tts.speak('yes?');

    } else if(listeningState) {
      let lastWord = String(e.value[0].split(' ').pop());
      for(let x = 0; x < infusionWords.length; x++) {
        if(lastWord.toLowerCase().includes(infusionWords[x])) {
          currentVoiceWord = String('infusion');  //must use regular variable not react state
        }
      }
      for(let x = 0; x < bolusWords.length; x++) {
        if(lastWord.toLowerCase().includes(bolusWords[x])) {
          currentVoiceWord = String('bolus');   //must use regular variable not react state  
        }
      }
      for(let x = 0; x < doseWords.length; x++) {
        if(lastWord.toLowerCase().includes(doseWords[x])) {
          currentVoiceWord = String('dose');   //must use regular variable not react state  
        }
      }
      if(!isNaN(String(lastWord)) && !isSpeaking) {
        if(String(currentVoiceWord) == String('infusion')) {
          trueInfusionRate = String(Number(lastWord))
          setInfusionRateFocus(true)
          setDoseFocus(false)
          setInfusionRateAmount(trueInfusionRate)
          fetch("http://192.168.1.1" + 
                      '/' + String(trueInfusionRate) + 
                      '/' + String(trueSyringeDiameter) + 
                      '/' + String(infuseRefill[trueDirection].label) + 
                      '/' + (runState ? 'start' : 'stop')
          );
          setTimeout(function() {
            
            setInfusionRateFocus(false)
            Tts.speak(
              'infusion rate' + String(trueInfusionRate) + 'cc per hour,' +
              'dose' + String(trueDoseAmount) + 'mcg per kg per min'
            );
            
          }, 3000);
          // setTimeout(function() {   //this cancels the voice after specified # of seconds clearing the voice text
          //   listeningState = false
          //   Voice.cancel()
          // }, 2000);
        } else if(String(currentVoiceWord) == String('bolus')) {
          trueBolusAmount = String(Number(lastWord))
          setVTBIAmount(trueBolusAmount)
          setTimeout(function() {
            Tts.speak('bolus' + String(trueBolusAmount) + 'mcg');
          }, 3000);
          // setTimeout(function() {   //this cancels the voice after specified # of seconds clearing the voice text
          //   listeningState = false
          //   Voice.cancel()
          // }, 13000);
        } else if(String(currentVoiceWord) == String('dose')) {
          setDoseFocus(true)
          setInfusionRateFocus(false)
          trueDoseAmount = String(Number(lastWord))
          setDoseAmount(trueDoseAmount)
          setTimeout(function() {
            setDoseFocus(false)
            Tts.speak(
              'dose' + String(trueDoseAmount) + 'mcg per kg per min, ' +
              'infusion rate' + String(trueInfusionRate) + 'cc per hour'
            );
          }, 3000);
          // setTimeout(function() {   //this cancels the voice after specified # of seconds clearing the voice text
          //   listeningState = false
          //   Voice.cancel()
          // }, 13000);
        } 
      } else if((String(lastWord) == 'begin') && !isSpeaking) {
        runState = true;
        Tts.stop();
        Tts.speak('starting infusion rate at' + String(trueInfusionRate) + 'cc per hour');
        setPumpTo(runState);
        // setTimeout(function() {   //this cancels the voice after specified # seconds clearing the voice text
        //   listeningState = false
        //   Voice.cancel()        
        // }, 6000);
      } else if((String(lastWord) == 'stop') && !isSpeaking) {
        runState = false;
        setPumpTo(runState); 
        Tts.stop();
        Tts.speak('stopping');
        // setTimeout(function() {   //this cancels the voice after specified # seconds clearing the voice text
        //   listeningState = false
        //   Voice.cancel()
        // }, 2000);
      }
    }
  }

  const startRecording = async () => {
    try {
      await Voice.start('en-GB')
    } catch (error) {
      console.log("error raised", error)
    }
  }
  const stopRecording = async () => {
    try {
      await Voice.stop()
    } catch (error) {
      console.log("error raised", error)
    }
  }

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStartHandler;
    Voice.onSpeechEnd = onSpeechEndHandler;
    Voice.onSpeechResults = onSpeechResultsHandler;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    }
  }, [])

  useEffect(() => {
    Tts.setDefaultLanguage('en-IE');
    Tts.addEventListener('tts-start', event => {
      isSpeaking = true;
      console.log('speaking', event);
    });
    Tts.addEventListener('tts-finish', event => {
      isSpeaking = false;
      console.log('no speaking', event);
      Tts.stop();
    });
    Tts.addEventListener('tts-cancel', event => {
      console.log('cancel', event)
      isSpeaking = false;
    });
    Tts.setDefaultRate(0.5);
    Tts.setDefaultPitch(1);
  }, []);

  useEffect(() => {
    trueInfusionRate = infusionRateAmount
    if(infusionRateFocus) {
      setDoseAmount(calculateDose)
    }
    
  }, [infusionRateAmount]);
  useEffect(() => {
    if(infusionRateFocus) setDoseAmount(calculateDose)
  }, [patientWeightAmount]);
  useEffect(() => {
    if(infusionRateFocus) setDoseAmount(calculateDose)
  }, [concentration]);

  useEffect(() => {
    trueDoseAmount = doseAmount
    if(doseFocus) {
      setInfusionRateAmount(calculateInfusionRate)
    }
  }, [doseAmount]);
  useEffect(() => {
    if(doseFocus) setInfusionRateAmount(calculateInfusionRate)
  }, [patientWeightAmount]);
  useEffect(() => {
    if(doseFocus) setInfusionRateAmount(calculateInfusionRate)
  }, [concentration]);

  return (
    <Fragment>
    <StatusBar barStyle="dark-content" />
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrolling}>
          
          <View style={[styles.buttonContainer, {backgroundColor: recordingState ? '#eeeeee' : '#fefefe'}]}>
            <Button
              title={recordingStateButton ? "Voice Control On" : "Voice Control Off"}
              onPress={() => {
                recordingState = !recordingState
                changeRecordingState(recordingState);    
                if(recordingState) {
                  startRecording();
                  listeningState = false;
                } else {
                  stopRecording();             
                }
                KeepAwake.activate();
              }}
            />
          </View>

          <ScrollView 
            horizontal
            ref={ref => {this.scrollView = ref}}
            onContentSizeChange={() => this.scrollView.scrollToEnd({animated: true})}
          >
            <Text>
              {result}
            </Text>
          </ScrollView>
          
          <View style={styles.listItem}>
            <Dropdown style={styles.dropdown}
              data={infuseRefill}
              labelField="label"
              valueField="value"
              onChange={item => {
                setDirection(item.value);
                trueDirection = item.value;
              }}
              value={direction}
            />
          </View>

          <View style={styles.listItem}>
            <Text style={styles.title}>
              Concentration:
            </Text>
            <TextInput style={styles.input}
              onChangeText={setConcentration}
              value={concentration}
              placeholder="enter value"
              keyboardType="numeric"
            />
            <Dropdown style={styles.dropdown}
              data={concentrationUnits}
              //search
              labelField="label"
              valueField="value"
              onChange={item => {
                setConcentrationUnit(item.value);
              }}
              placeholder={'units'}
              searchPlaceholder="Search..."
              value={concentrationUnit}
              selectedTextStyle={styles.dropdownText}
            />
          </View>

          <View style={styles.listItem}>
            <Text style={styles.title}>
              Patient Weight:
            </Text>
            <TextInput style={styles.input}
              onChangeText={setPatientWeightAmount}
              value={patientWeightAmount}
              placeholder="enter value"
              keyboardType="numeric"
            />
            <Dropdown style={styles.dropdown}
              data={patientWeightUnits}
              labelField="label"
              valueField="value"
              onChange={item => {
                setPatientWeightUnit(item.value);
              }}
              placeholder={'units'}
              searchPlaceholder="Search..."
              value={patientWeightUnit}
              selectedTextStyle={styles.dropdownText}
            />
          </View>

          <View style={styles.listItem}>
            <Text style={styles.title}>
              Infusion Rate:
            </Text>
            <TextInput style={styles.input}
              onChangeText={setInfusionRateAmount}
              onFocus={() => {
                setInfusionRateFocus(true)
                setDoseFocus(false)
              }}
              onBlur={() => {
                trueInfusionRate = infusionRateAmount;
                setPumpTo(runState);
              }}
              value={infusionRateAmount}                
              placeholder="enter value"
              keyboardType="numeric"
            />
            <Dropdown style={styles.dropdown}
              data={infusionRateUnits}
              labelField="label"
              valueField="value"
              onChange={item => {
                setInfusionRateUnit(item.value);
              }}
              placeholder={'units'}
              searchPlaceholder="Search..."
              value={infusionRateUnit}
              selectedTextStyle={styles.dropdownText}
            />
          </View>

          <View style={styles.listItem}>
            <Text style={styles.title}>
              Bolus:
            </Text>
            <TextInput style={styles.input}
              onChangeText={setVTBIAmount}
              value={vtbiAmount}
              placeholder="enter value"
              keyboardType="numeric"
            />
            <Dropdown style={styles.dropdown}
              data={vtbiUnits}
              labelField="label"
              valueField="value"
              onChange={item => {
                setVTBIUnit(item.value);
              }}
              placeholder={'units'}
              searchPlaceholder="Search..."
              value={vtbiUnit}
              selectedTextStyle={styles.dropdownText}
            />
          </View>

          <View style={styles.listItem}>
            <Text style={styles.title}>
              Dose:
            </Text>
            <TextInput style={styles.input}
              onChangeText={setDoseAmount}
              onFocus={() => {
                setDoseFocus(true)
                setInfusionRateFocus(false)
              }}
              value={doseAmount}
              placeholder="enter value"
              keyboardType="numeric"
            />
            <Dropdown style={styles.dropdown}
              data={doseUnits}
              labelField="label"
              valueField="value"
              onChange={item => {
                setDoseUnit(item.value);
              }}
              placeholder={'units'}
              searchPlaceholder="Search..."
              value={doseUnit}
              selectedTextStyle={styles.dropdownText}
            />
          </View>

          <View style={styles.listItem}>
            <Text style={styles.title}>
              Syringe:
            </Text>
            <Dropdown style={styles.dropdown}
              data={syringes}
              labelField="label"
              valueField="value"
              onChange={item => {
                trueSyringeDiameter = item.value;       //HOW TO DO IT!!! (SO FAR)
                setSyringeSize(trueSyringeDiameter);    //WITHOUT ONE STEP BEHIND STATES
              }}
              placeholder={'Select syringe'}
              searchPlaceholder="Search..."
              search
              value={syringeSize}
              selectedTextStyle={styles.dropdownText}
            />
          </View>

          <View style={[styles.buttonContainer, {backgroundColor: buttonState ? '#ff0000' : '#00ff00'}]}>
            <Button
              title={buttonState ? "Stop" : "Begin"}
              onPress={() => {
                runState = !runState
                setPumpTo(runState); 
              }}
            />
          </View>
        
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
    </Fragment>
  );

  function calculateDose() {
    return String(parseFloat(((infusionRateAmount*(concentration*1000))/(patientWeightAmount*60)).toFixed(3)))
  }

  function calculateInfusionRate() {
    return String(parseFloat(((doseAmount*patientWeightAmount*60)/(concentration*1000)).toFixed(3)))
  }

  function setPumpTo(r) {
    changeButtonState(r);
    fetch("http://192.168.1.1" + 
          '/' + String(trueInfusionRate) + 
          '/' + String(trueSyringeDiameter) + 
          '/' + String(infuseRefill[trueDirection].label) + 
          '/' + (runState ? 'start' : 'stop')
          );
    // console.log(trueInfusionRate);
    // console.log(trueSyringeDiameter);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: 'white',
  },
  listItem: {
    backgroundColor: 'white',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
    shadowOpacity: 0.4,
    padding: 5,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: 'center',
  },
  title: {
    flex: 4,
    fontSize: 14,
    padding: 0,
    marginVertical: 2,
    marginHorizontal: 2,
  },
  outputItem: {
    padding: 5,
    marginVertical: 5,
    marginHorizontal: 5,
    flexDirection: "row",
    alignItems: 'center',
  },
  outputTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
    padding: 1,
    marginVertical: 2,
    marginHorizontal: 2,
  },
  input: {
    flex: 3,
    height: 40,
    borderWidth: 0.5,
    padding: 10,
    backgroundColor: 'white',
    borderColor: 'grey',
    marginVertical: 2,
    marginHorizontal: 5,
  },
  dropdown: {
    flex: 4,
    paddingHorizontal: 10,
    marginHorizontal: 1,
    height: 50,
    borderRadius: 8,
    fontSize: 10,
  },
  dropdownText: {
    fontSize: 14,
  },
  scrolling: {
    backgroundColor: 'white'
  },
  buttonContainer: {
    height: 60,
    justifyContent: 'center',
    borderWidth: 1,
    flex: 1,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
    shadowOpacity: 0.4,
    marginVertical: 5,
    marginHorizontal: 5,
  }
});