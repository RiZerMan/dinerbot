import { OrdersService } from 'src/orders/orders.service';
import { InjectModel } from '@nestjs/mongoose';
import { RestaurantsService } from 'src/restaurants/restaurants.service';
import {
  HttpService,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PathingService } from 'src/pathing/pathing.service';
import { Robot, RobotDocument } from './robot.schema';
import { Model } from 'mongoose';
import { InitRobotDto } from './dto/init-robot.dto';
import { Order } from 'src/orders/schemas/order.schema';
import { StatusEnum } from 'src/orders/status';

@Injectable()
export class RobotsService {
  constructor(
    @InjectModel(Robot.name)
    private robotModel: Model<RobotDocument>,
    private httpService: HttpService,
    private pathingService: PathingService,
    private restaurantService: RestaurantsService,
    private orderService: OrdersService,
  ) {}

  findNearestRobot(location) {
    return this.robotModel.findOne().exec();
  }

  async getRestaurantLocation(id) {
    const restaurant = await this.restaurantService.findOne(id);
    return restaurant.location;
  }

  sendPathToRobot(ipAdress, startLocation, endLocation, order) {
    const pathToRestaurant = this.pathingService.findShortestPath(
      startLocation,
      endLocation,
    );

    this.httpService
      .post(`http://${ipAdress}/order`, {
        steps: pathToRestaurant.actions,
      })
      .subscribe(
        async (res) => {
          const robot = await this.findRobotByIp(ipAdress);
          Object.assign(robot, { currentOrder: order['_id'] });
          await robot.save();

          if (order?.status === 'delivery') {
            this.orderService.updateOne(order['_id'], {
              status: StatusEnum.Delivery,
            });
          }
        },
        (err) => {
          console.log(
            err.response || 'Robot cannot be reached, might be offline ',
          );
        },
      );
  }

  async startRobot(order) {
    const restaurantLocation = await this.getRestaurantLocation(
      order.restaurant,
    );
    const nearestRobot = await this.findNearestRobot(restaurantLocation);

    return this.sendPathToRobot(
      nearestRobot?.ip || '0.0.0.0',
      nearestRobot?.location || 'A1',
      restaurantLocation,
      order,
    );
  }

  async sendRobotToHome(order: Order) {
    const robot = await this.findRobotByOrder(order['_id']);
    return this.sendPathToRobot(
      robot.ip,
      order.restaurant.location,
      order.destination,
      order,
    );
  }

  async initRobot(initRobotDto: InitRobotDto) {
    let robot = await this.robotModel
      .findOne({
        ip: initRobotDto.ip,
      })
      .exec();

    if (robot) {
      Object.assign(robot, { ...initRobotDto });
    } else {
      robot = new this.robotModel(initRobotDto);
    }
    return robot.save();
  }

  async findRobotByIp(ip): Promise<RobotDocument> {
    let robot;
    try {
      robot = await this.robotModel
        .findOne({
          ip,
        })
        .exec();
    } catch (error) {
      throw new HttpException(
        'No robot found with the given id',
        HttpStatus.NOT_FOUND,
      );
    }
    if (!robot) {
      throw new HttpException(
        'No robot found with the given id',
        HttpStatus.NOT_FOUND,
      );
    }
    return robot;
  }

  async findRobotByOrder(orderId): Promise<RobotDocument> {
    let robot;
    try {
      robot = await this.robotModel
        .findOne({
          currentOrder: orderId,
        })
        .exec();
    } catch (error) {
      throw new HttpException(
        'No robot found with the given id',
        HttpStatus.NOT_FOUND,
      );
    }
    if (!robot) {
      throw new HttpException(
        'No robot found with the given id',
        HttpStatus.NOT_FOUND,
      );
    }
    return robot;
  }
}
