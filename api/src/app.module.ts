import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrdersModule } from './orders/orders.module';
import { UserMiddleware } from './common/middlewares/user.middleware';
import { EventsModule } from './events/events.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { MulterModule } from '@nestjs/platform-express';
import * as autopopulate from 'mongoose-autopopulate';

@Module({
  imports: [
    OrdersModule,
    EventsModule,
    RestaurantsModule,
    EventEmitterModule.forRoot(),
    MongooseModule.forRoot('mongodb://localhost/nest', {
      connectionFactory: (connection) => {
        connection.plugin(autopopulate);
        return connection;
      },
    }),
    MulterModule.register({
      dest: './files',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
