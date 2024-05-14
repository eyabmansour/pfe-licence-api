import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { Order } from '@prisma/client';

@Injectable()
export class EventService {
  private orderCreatedSubject = new Subject<Order>();

  orderCreated$ = this.orderCreatedSubject.asObservable();

  emitOrderCreated(order: Order) {
    this.orderCreatedSubject.next(order);
  }
}
