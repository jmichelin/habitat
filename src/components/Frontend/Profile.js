import React, { Component } from 'react';
import { AsyncStorage, Modal, ImageStore, StyleSheet, Text, View, Image, TextInput, Button, Clipboard, TouchableOpacity, TouchableHighlight, Alert, ScrollView } from 'react-native';
import Expo, { Asset, Camera, Permissions, ImagePicker } from 'expo';
import axios from 'axios';
import AllTasks from './AllTasks.js';
import CalendarStrip from 'react-native-calendar-strip';
import moment from 'moment';
import convertKey from './convertKey'

export default class Profile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      image: require('../assets/Profile.png'),
      visibleModal: false,
      username: null,
      dates: null,
      allDates: null,
      daysWithTask: {},
      dailyTasks: [],
      locations: {},
      inProgress: 0,
      completed: 0,
      failed: 0,
    }
    this.showModal = this.showModal.bind(this);
    this.uploadPhoto = this.uploadPhoto.bind(this);
    this.getPicture = this.getPicture.bind(this);
  }

  componentDidMount() {
    this.setState({
      username: this.props.screenProps.userID
    })
    this.getPicture();
    this.getCompletedTask();
    this.countTasks();
  }

  getPicture() {
    axios.get('http://10.16.1.233:3000/pictures', { params: { username: this.props.screenProps.userID } })
      .then(res => {
        let jpg = 'data:image/jpg;base64,' + res.data.picture;
        this.setState({ image: jpg })
      })
  }

  getCompletedTask() {
    var dateFormat = 'YYYY-MM-DD HH:mm:ss';
    var testDateUtc = moment.utc(new Date());
    var localDate = testDateUtc.local();

    axios.get('http://10.16.1.233:3000/completedTasks', { params: { username: this.props.screenProps.userID } })
      .then(tasks => {
        tasks.data.forEach(task => {
          let eachDate = task.Start.split(' ').slice(0, 3).reduce((acc, task) => {
            return `${acc} ${task}`;
          });
          eachDate = eachDate.slice(0, eachDate.length - 1);
          let key = convertKey(eachDate);
          // creates an object with keys of dates and values of tasks within those dates
          this.state.daysWithTask[key] ? this.state.daysWithTask[key].push(task) : this.state.daysWithTask[key] = [task];
          // creates an object with keys of locations and values of
          this.state.locations[task.Marker_Title] ? this.state.locations[task.Marker_Title].push(task) : this.state.locations[task.Marker_Title] = [task];
        })
      })
      .then(res => this.grabDailyTasks(JSON.stringify(localDate).slice(1, 11)))
  }

  countTasks() {
    axios.get('http://10.16.1.233:3000/countTasks', { params: { username: this.props.screenProps.userID } })
      .then(tasks => {
        tasks.data.forEach(task => {
          if (task.Completion === "False") {
            this.setState({ failed: task.count })
          } else if (task.Completion === "True") {
            this.setState({ completed: task.count })
          } else {
            this.setState({ inProgress: task.count })
          }
        })
      })
  }


  pickPhoto = async () => {
    let picture = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      base64: true,
    });
    this.handlePicture(picture);
  }

  takePhoto = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === 'granted' })
    let picture = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      base64: true,
    })
      .catch(err => console.log(err, 'ERR!!!'))
    this.handlePicture(picture);
  }

  handlePicture = async picture => {
    try {
      this.setState({ visibleModal: !this.state.visibleModal });
      if (!picture.cancelled) {
      }
    } catch (e) {
      console.log({ e }, 'error!');
      alert('This is not working');
    } finally {
      this.setState({ uploading: false });
      this.uploadPhoto(picture);
    }
  }

  uploadPhoto(picture) {
    let uri = picture.base64;
    let pictureText = 'data:image/jpg;base64,' + uri;
    axios.post('http://10.16.1.233:3000/pictures', { picture: uri, username: this.state.username })
      .then(res => {
        let jpg = 'data:image/jpg;base64,' + res.data.picture;
        this.setState({ image: jpg })
      });
  }


  showModal(stat) {
    this.setState({ visibleModal: stat })
  }

  grabDailyTasks(date) {
    date = JSON.stringify(date).slice(1, 11);
    this.setState({
      dailyTasks: this.state.daysWithTask[date] || []
    })
  }

  changeLocation(location) {
    console.log(location,' LOCATION')
  }

  render() {
    
    let tabs = Object.entries(this.state.locations)
    console.log(tabs)
    return (
      <View style={{ flex: 1, backgroundColor: '#ddd' }}>
        <View style={{ marginLeft: 5, marginTop: 20, alignItems: 'flex-start' }}>
          <Button
            onPress={() => this.props.navigation.navigate('DrawerToggle')}
            title="&#9776;"
          />
        </View>
        <View style={{ flex: 1, alignItems: 'flex-start', flexDirection: 'row' }}>
          <View style={{ flex: 1.5, justifyContent: 'center', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => this.showModal(!this.state.visibleModal)}>
              <Image style={styles.photo} source={{ uri: `${this.state.image}` }} />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 3, alignSelf: 'stretch', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={styles.title}>
              Completed Tasks: {this.state.completed}
            </Text>
            <Text style={styles.title}>
              In Progress: {this.state.inProgress}
            </Text>
            <Text style={styles.title}>
              Failed Tasks: {this.state.failed}
            </Text>
          </View>
        </View>
        <View style={{ flex: 0.7, alignItems: 'flex-end' }}>
        <ScrollView horizontal={true} style={{ flexDirection: 'row', marginTop: 10, width: 250, alignContent: 'stretch'}}>
          { this.state.locations ? (
            tabs.map((ele, i) => {
              return (
                <TouchableOpacity key={i} onPress={() => {this.changeLocation(ele)}}>
                  <View style={{ alignItems: 'center', justifyContent: 'center', borderColor: 'black', borderWidth: 1, width: 70, height: '100%'}}>
                    <Text>{ele[0]}</Text>
                  </View>
                </TouchableOpacity>
              )
            })
          ) : null }
        </ScrollView>
        </View>
        <View style={{ flex: 4, borderColor: 'black', borderTopWidth: 1 }}>
          <ScrollView style={{ marginTop: 15 }}>
            {this.state.dailyTasks.map((task, i) => {
              return (
                <AllTasks task={task} key={i} />
              )
            })}
          </ScrollView>
        </View>
        <CalendarStrip
          calendarAnimation={{ type: 'sequence', duration: 30 }}
          daySelectionAnimation={{ type: 'background', duration: 300, highlightColor: '#9265DC' }}
          style={{ height: 100 }}
          calendarHeaderStyle={{ color: 'white' }}
          calendarColor={'#7743CE'}
          dateNumberStyle={{ color: 'white' }}
          dateNameStyle={{ color: 'white' }}
          iconLeft={require('../assets/egg2.png')}
          iconRight={require('../assets/egg3.png')}
          iconContainer={{ flex: 0.1 }}
          onDateSelected={(date) => this.grabDailyTasks(date)}
        />
        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.visibleModal}
          onRequestClosed={() => { alert('Photo is not selected!!') }}
        >
          <View>
            <View style={{ height: 470, opacity: 0.7, backgroundColor: '#ddd' }}>
              <Image source={require('../assets/toastlogo.png')} style={{ height: '100%', width: '100%', opacity: 0.8 }} />
            </View>
            <View style={{ height: '100%', backgroundColor: '#ddd', opacity: 0.7 }}>
              <View style={styles.button} >
                <Button title={`Take a photo`} onPress={this.takePhoto} />
              </View>
              <View style={styles.button} >
                <Button title={`Photo from library`} onPress={this.pickPhoto} />
              </View>
              <View style={styles.button} >
                <Button title={`Close`} onPress={() => { this.showModal(!this.state.visibleModal) }} />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }
}

const sprites = [
  [0, require("../assets/Ecosystem/tree0.png")],
  [1, require("../assets/Ecosystem/tree1.png")],
  [2, require("../assets/Ecosystem/tree2.png")]
]

const styles = StyleSheet.create({
  top: {
    flex: 0.5,
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  photo: {
    backgroundColor: 'red',
    borderRadius: 50,
    opacity: 0.7,
    borderBottomLeftRadius: 50,
    shadowColor: 'rgba(0,0,0,1)',
    shadowOpacity: 0.2,
    shadowOffset: { width: 4, height: 4 },
    shadowRadius: 5,
    zIndex: 3,
    width: 100,
    height: 100
  },
  middle: {
    flex: 6,
    width: '100%'
  },
  bottom: {
    flex: 2,
    backgroundColor: '#fff'
  },
  button: {
    backgroundColor: '#ddd',
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'black',
    width: 250,
    alignItems: 'center',
    marginLeft: 60,
    marginTop: 5,
    marginBottom: 5
  },
  title: {
    fontSize: 15,
    marginTop: 5,
    fontWeight: "bold",
  }
})
