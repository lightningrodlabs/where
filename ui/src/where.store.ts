import { serializeHash } from '@holochain-open-dev/core-types';
import {
  observable,
  makeObservable,
  action,
  runInAction,
  computed,
} from 'mobx';
import { WhereService } from './where.service';
import { Dictionary, Space } from './types';

export class WhereStore {
  @observable
  public spaces: Dictionary<Space> = {
    "somekey": {
      name: "earth",
      wheres: [
        { entry: {location: {x: 1150, y: 450}, meta: "My house"},
          authorPic: "https://i.imgur.com/oIrcAO8.jpg",
          authorName: "Eggy",
          authorPubkey: "mememememememememememememememeeeeee"},
        { entry: {location: {x: 1890, y: 500}, meta: "My apartment"},
          authorPic: "https://i.imgur.com/4BKqQY1.png",
          authorName: "Monk",
          authorPubkey: "sntahoeuabcorchaotbkantgcdoesucd"}
      ],
      surface: {
        url: "https://h5pstudio.ecampusontario.ca/sites/default/files/h5p/content/9451/images/image-5f6645b4ef14e.jpg",
        size: {x:1150, y:450}
      },
    },
  };

  constructor(protected service: WhereService) {
    makeObservable(this);
  }
}
